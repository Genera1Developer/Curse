document.addEventListener("DOMContentLoaded", () => {
  const createChatForm = document.getElementById("create-chat-form");
  const chatList = document.getElementById("chat-list");
  const chatContent = document.getElementById("chat-content");
  const chatImage = document.getElementById("chat-image");

  
  const getUsername = () => {
    let username = localStorage.getItem("username");
    if (!username) {
      username = prompt("Please enter a username:") || "Anonymous";
      localStorage.setItem("username", username);
    }
    return username;
  };

  
  const loadPosts = async () => {
    try {
      const res = await fetch("/api/posts");
      const posts = await res.json();
      chatList.innerHTML = ""; 
      posts.forEach(post => createChat(post));
    } catch (error) {
      console.error("Failed to load posts:", error);
    }
  };

  
  const createChat = (post) => {
    const chatElement = document.createElement("div");
    chatElement.classList.add("chat");

    
    const usernameTag = document.createElement("p");
    usernameTag.innerHTML = post.username + (post.isOp ? " <span class='op-tag'>(OP)</span>" : "") + ":";
    chatElement.appendChild(usernameTag);

    
    const chatContent = document.createElement("p");
    chatContent.innerHTML = post.content;
    chatElement.appendChild(chatContent);

  
    if (post.imageUrl) {
      const imageElement = document.createElement("img");
      imageElement.src = post.imageUrl;
      imageElement.alt = "User uploaded image";
      chatElement.appendChild(imageElement);
    }

    // fuck you javascript
    const timestamp = document.createElement("span");
    timestamp.textContent = `Posted on: ${post.timestamp}`;
    chatElement.appendChild(timestamp);

    // fuck you poster
    const likeButton = document.createElement("button");
    likeButton.textContent = `👍 ${post.likes || 0}`;
    likeButton.classList.add("like-button");
    likeButton.addEventListener("click", async () => handleLike(post.id, likeButton));

    const dislikeButton = document.createElement("button");
    dislikeButton.textContent = `👎 ${post.dislikes || 0}`;
    dislikeButton.classList.add("dislike-button");
    dislikeButton.addEventListener("click", async () => handleDislike(post.id, dislikeButton));

    chatElement.appendChild(likeButton);
    chatElement.appendChild(dislikeButton);

    // this comment sucks
    const commentsSection = document.createElement("div");
    commentsSection.classList.add("comments");
    post.comments.forEach(comment => appendComment(comment, commentsSection, post.username));
    
    // go the fuck away
    const seeCommentsButton = document.createElement("button");
    seeCommentsButton.textContent = "See Comments";
    seeCommentsButton.addEventListener("click", () => toggleComments(commentsSection));
    chatElement.appendChild(seeCommentsButton);
    chatElement.appendChild(commentsSection);

    // no one is sending you ch**d p**n lil bro
    const replyButton = document.createElement("button");
    replyButton.textContent = "Reply";
    replyButton.addEventListener("click", () => toggleReplyBox(replyForm));

    const replyForm = document.createElement("form");
    replyForm.style.display = "none";

    const replyInput = document.createElement("textarea");
    replyInput.placeholder = "Write your reply...";
    replyForm.appendChild(replyInput);

    const replySubmit = document.createElement("button");
    replySubmit.textContent = "Post Reply";
    replyForm.appendChild(replySubmit);

    replyForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = getUsername();
      await postComment(post.id, replyInput.value, commentsSection, username, post.username);
      replyInput.value = "";
    });

    chatElement.appendChild(replyButton);
    chatElement.appendChild(replyForm);
    
    chatList.appendChild(chatElement);
  };

  
  const appendComment = (comment, commentsSection, postOwner) => {
    const commentElement = document.createElement("div");
    commentElement.classList.add("comment");

    // YOU ARE NOT SPECIALLLLLL
    const commentUsername = document.createElement("p");
    commentUsername.innerHTML = comment.username + (comment.username === postOwner ? " <span class='op-tag'>(OP)</span>" : "") + ":";
    
    const commentContent = document.createElement("p");
    commentContent.textContent = comment.content;
    
    commentElement.appendChild(commentUsername);
    commentElement.appendChild(commentContent);
    commentsSection.appendChild(commentElement);
  };

  
  const toggleComments = (commentsSection) => {
    commentsSection.style.display = commentsSection.style.display === "none" ? "block" : "none";
  };

  
  const toggleReplyBox = (replyForm) => {
    replyForm.style.display = replyForm.style.display === "none" ? "block" : "none";
  };

  
  const postComment = async (postId, content, commentsSection, username, postOwner) => {
    const res = await fetch(`/api/posts/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, username }),
    });

    const comment = await res.json();
    appendComment(comment, commentsSection, postOwner);
  };

  // i like this
  const handleLike = async (postId, likeButton) => {
    const res = await fetch(`/api/posts/${postId}/like`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      likeButton.textContent = `👍 ${data.likes}`;
    }
  };

  
  const handleDislike = async (postId, dislikeButton) => {
    const res = await fetch(`/api/posts/${postId}/dislike`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      dislikeButton.textContent = `👎 ${data.dislikes}`;
    }
  };

  
  createChatForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = getUsername();
    const formData = new FormData();
    formData.append("content", chatContent.value.trim());
    formData.append("username", username);

    if (chatImage.files.length > 0) {
      formData.append("image", chatImage.files[0]);
    }

    const res = await fetch("/api/posts", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const post = await res.json();
      createChat(post);
      chatContent.value = "";
      chatImage.value = "";
    } else {
      console.error("Failed to post chat");
    }
  });

  loadPosts();
});
