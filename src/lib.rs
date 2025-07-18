use borsh::{BorshDeserialize, BorshSerialize};
use borsh::to_vec;

use near_sdk::collections::{LookupMap, UnorderedMap, UnorderedSet, Vector};
use near_sdk::serde::{Deserialize, Serialize};
use near_sdk::{
    env, near_bindgen, AccountId, BorshStorageKey, NearToken, PanicOnDefault, Promise,
};
use schemars::JsonSchema;

pub type PostId = u64;

#[derive(BorshStorageKey, BorshSerialize)]
pub enum StorageKey {
    Posts,
    Comments { post_id: u64 },
    UserPosts { account_id: AccountId },
    RegisteredUsers,
    Followers,
    Following,
    Likes { post_id: u64 },
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone, JsonSchema)]
#[serde(crate = "near_sdk::serde")]
pub struct Comment {
    commenter: String, // Changed from AccountId to String for ABI
    content: String,
    timestamp: u64,
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone, JsonSchema)]
#[serde(crate = "near_sdk::serde")]
pub struct Post {
    post_id: PostId,
    owner: String, // Changed from AccountId to String for ABI
    caption: String,
    media_type: String,
    ipfs_hash: Option<String>,
    likes: u64,
    timestamp: u64,
}

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
pub struct NEARCast {
    posts: UnorderedMap<PostId, Post>,
    user_posts: LookupMap<AccountId, Vector<PostId>>,
    comments: LookupMap<PostId, Vector<Comment>>,
    likes: LookupMap<PostId, UnorderedSet<AccountId>>,
    followers: LookupMap<AccountId, UnorderedSet<AccountId>>,
    following: LookupMap<AccountId, UnorderedSet<AccountId>>,
    registered_users: UnorderedSet<AccountId>,
    post_counter: PostId,
    owner: AccountId,
}

#[near_bindgen]
impl NEARCast {
    #[init]
    pub fn new(owner: AccountId) -> Self {
        Self {
            posts: UnorderedMap::new(StorageKey::Posts),
            user_posts: LookupMap::new(StorageKey::UserPosts {
                account_id: "init.testnet".parse().unwrap(),
            }),
            comments: LookupMap::new(StorageKey::Comments { post_id: 0 }),
            likes: LookupMap::new(StorageKey::Likes { post_id: 0 }),
            followers: LookupMap::new(StorageKey::Followers),
            following: LookupMap::new(StorageKey::Following),
            registered_users: UnorderedSet::new(StorageKey::RegisteredUsers),
            post_counter: 0,
            owner,
        }
    }

    fn register_user(&mut self, account_id: &AccountId) {
        if !self.registered_users.contains(account_id) {
            self.registered_users.insert(account_id);
        }
    }

    #[payable]
    pub fn create_post(
        &mut self,
        caption: String,
        media_type: String,
        ipfs_hash: Option<String>,
    ) {
        let caller = env::predecessor_account_id();
        self.register_user(&caller);

        self.post_counter += 1;
        let post = Post {
            post_id: self.post_counter,
            owner: caller.clone().to_string(),
            caption,
            media_type,
            ipfs_hash,
            likes: 0,
            timestamp: env::block_timestamp_ms(),
        };

        self.posts.insert(&self.post_counter, &post);

        let mut post_vec = self.user_posts.get(&caller).unwrap_or_else(|| {
            Vector::new(
                to_vec(&StorageKey::UserPosts {
                    account_id: caller.clone(),
                })
                .unwrap(),
            )
        });

        post_vec.push(&self.post_counter);
        self.user_posts.insert(&caller, &post_vec);
    }

    pub fn edit_post(&mut self, post_id: PostId, new_caption: String) {
        let caller = env::predecessor_account_id();
        let mut post = self.posts.get(&post_id).expect("Post not found");
        assert_eq!(caller.to_string(), post.owner, "Not the post owner");
        post.caption = new_caption;
        self.posts.insert(&post_id, &post);
    }

    pub fn delete_post(&mut self, post_id: PostId) {
        let caller = env::predecessor_account_id();
        let post = self.posts.get(&post_id).expect("Post not found");
        assert_eq!(caller.to_string(), post.owner, "Not authorized to delete");

        self.posts.remove(&post_id);

        if let Some(original_vec) = self.user_posts.get(&caller) {
            let remaining: Vec<_> = original_vec.iter().filter(|&id| id != post_id).collect();

            let mut new_vec = Vector::new(
                to_vec(&StorageKey::UserPosts {
                    account_id: caller.clone(),
                })
                .unwrap(),
            );

            for id in remaining {
                new_vec.push(&id);
            }

            self.user_posts.insert(&caller, &new_vec);
        }
    }

    pub fn like_post(&mut self, post_id: PostId) {
        let caller = env::predecessor_account_id();
        let mut post = self.posts.get(&post_id).expect("Post not found");

        let mut likes = self.likes.get(&post_id).unwrap_or_else(|| {
            UnorderedSet::new(to_vec(&StorageKey::Likes { post_id }).unwrap())
        });

        assert!(!likes.contains(&caller), "Already liked this post");

        likes.insert(&caller);
        post.likes += 1;

        self.likes.insert(&post_id, &likes);
        self.posts.insert(&post_id, &post);
    }

    pub fn comment_post(&mut self, post_id: PostId, content: String) {
        let caller = env::predecessor_account_id();
        let comment = Comment {
            commenter: caller.to_string(),
            content,
            timestamp: env::block_timestamp_ms(),
        };

        let mut comments = self.comments.get(&post_id).unwrap_or_else(|| {
            Vector::new(to_vec(&StorageKey::Comments { post_id }).unwrap())
        });

        comments.push(&comment);
        self.comments.insert(&post_id, &comments);
    }

    pub fn follow_user(&mut self, user: AccountId) {
        let caller = env::predecessor_account_id();
        assert_ne!(caller, user, "Cannot follow yourself");

        let mut followers = self.followers.get(&user).unwrap_or_else(|| {
            UnorderedSet::new(to_vec(&StorageKey::Followers).unwrap())
        });

        let mut following = self.following.get(&caller).unwrap_or_else(|| {
            UnorderedSet::new(to_vec(&StorageKey::Following).unwrap())
        });

        followers.insert(&caller);
        following.insert(&user);

        self.followers.insert(&user, &followers);
        self.following.insert(&caller, &following);
    }

    pub fn unfollow_user(&mut self, user: AccountId) {
        let caller = env::predecessor_account_id();

        if let Some(mut followers) = self.followers.get(&user) {
            followers.remove(&caller);
            self.followers.insert(&user, &followers);
        }

        if let Some(mut following) = self.following.get(&caller) {
            following.remove(&user);
            self.following.insert(&caller, &following);
        }
    }

    #[payable]
    pub fn support_user(&mut self, recipient: AccountId) {
        let amount = env::attached_deposit().as_yoctonear();
        let min = 1_000_000_000_000_000_000_000; // 0.001 NEAR

        assert!(amount >= min, "Minimum support amount is 0.001 NEAR");

        let platform_cut = amount / 20; // 5%
        let receiver_amount = amount - platform_cut;

        Promise::new(recipient).transfer(NearToken::from_yoctonear(receiver_amount));
        Promise::new(self.owner.clone()).transfer(NearToken::from_yoctonear(platform_cut));
    }

    // --------- View Functions -----------

    pub fn get_all_posts(&self) -> Vec<Post> {
        self.posts.values_as_vector().to_vec()
    }

    pub fn get_user_posts(&self, user: AccountId) -> Vec<Post> {
        self.user_posts
            .get(&user)
            .map(|vec| vec.iter().filter_map(|id| self.posts.get(&id)).collect())
            .unwrap_or_default()
    }

    pub fn get_comments(&self, post_id: PostId) -> Vec<Comment> {
        self.comments.get(&post_id).map(|v| v.to_vec()).unwrap_or_default()
    }

    pub fn get_followers(&self, user: AccountId) -> Vec<AccountId> {
        self.followers.get(&user).map(|s| s.to_vec()).unwrap_or_default()
    }

    pub fn get_following(&self, user: AccountId) -> Vec<AccountId> {
        self.following.get(&user).map(|s| s.to_vec()).unwrap_or_default()
    }

    pub fn get_registered_users(&self) -> Vec<AccountId> {
        self.registered_users.to_vec()
    }
}
