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

    const timestamp = document.createElement("span");
    timestamp.textContent = `Posted on: ${post.timestamp}`;
    chatElement.appendChild(timestamp);

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

    const commentsSection = document.createElement("div");
    commentsSection.classList.add("comments");
    commentsSection.style.display = "none";
    if (post.comments && Array.isArray(post.comments)) {
      post.comments.forEach(comment => appendComment(comment, commentsSection, post.username));
    }
    
    const seeCommentsButton = document.createElement("button");
    seeCommentsButton.textContent = "See Comments";
    seeCommentsButton.addEventListener("click", () => {
      commentsSection.style.display = commentsSection.style.display === "none" ? "block" : "none";
    });
    chatElement.appendChild(seeCommentsButton);
    chatElement.appendChild(commentsSection);

    const replyButton = document.createElement("button");
    replyButton.textContent = "Reply";
    replyButton.addEventListener("click", () => {
      replyForm.style.display = replyForm.style.display === "none" ? "block" : "none";
    });

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
      if (replyInput.value.trim()) {
        try {
          const res = await fetch(`/api/posts?postId=${post.id}/comments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: replyInput.value.trim(), username }),
          });

          if (res.ok) {
            const comment = await res.json();
            appendComment(comment, commentsSection, post.username);
            replyInput.value = "";
            replyForm.style.display = "none";
            commentsSection.style.display = "block";
          }
        } catch (error) {
          console.error("Error posting comment:", error);
        }
      }
    });

    chatElement.appendChild(replyButton);
    chatElement.appendChild(replyForm);
    
    chatList.appendChild(chatElement);
  };

  const appendComment = (comment, commentsSection, postOwner) => {
    const commentElement = document.createElement("div");
    commentElement.classList.add("comment");

    const commentUsername = document.createElement("p");
    commentUsername.innerHTML = comment.username + (comment.username === postOwner ? " <span class='op-tag'>(OP)</span>" : "") + ":";
    
    const commentContent = document.createElement("p");
    commentContent.textContent = comment.content;
    
    commentElement.appendChild(commentUsername);
    commentElement.appendChild(commentContent);
    commentsSection.appendChild(commentElement);
  };

  const handleLike = async (postId, likeButton) => {
    try {
      const res = await fetch(`/api/posts?action=like&postId=${postId}`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        likeButton.textContent = `👍 ${data.likes}`;
      }
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handleDislike = async (postId, dislikeButton) => {
    try {
      const res = await fetch(`/api/posts?action=dislike&postId=${postId}`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        dislikeButton.textContent = `👎 ${data.dislikes}`;
      }
    } catch (error) {
      console.error("Error disliking post:", error);
    }
  };

  createChatForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const content = chatContent.value.trim();
    if (!content) return;

    const username = getUsername();
    const formData = new FormData();
    formData.append("content", content);
    formData.append("username", username);

    if (chatImage.files.length > 0) {
      formData.append("image", chatImage.files[0]);
    }

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, username }),
      });

      if (res.ok) {
        const post = await res.json();
        createChat(post);
        chatContent.value = "";
        chatImage.value = "";
      }
    } catch (error) {
      console.error("Error creating post:", error);
    }
  });

  loadPosts();
});
