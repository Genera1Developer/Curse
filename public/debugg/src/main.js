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
      posts.forEach(post => {
        if (!post.isComment) {
          createChat(post);
        }
      });
    } catch (error) {
      console.error("Failed to load posts:", error);
    }
  };

  const createChat = (post) => {
    const chatElement = document.createElement("div");
    chatElement.classList.add("chat");

    const usernameTag = document.createElement("p");
    usernameTag.innerHTML = `${escapeHtml(post.username)}${post.isOp ? " <span class='op-tag'>(OP)</span>" : ""}:`;
    chatElement.appendChild(usernameTag);

    const content = document.createElement("p");
    content.textContent = post.content;
    chatElement.appendChild(content);

    if (post.imageUrl) {
      const image = document.createElement("img");
      image.src = post.imageUrl;
      image.alt = "User uploaded image";
      chatElement.appendChild(image);
    }

    const timestamp = document.createElement("span");
    const formattedDate = new Date(post.timestamp).toLocaleString();
    timestamp.textContent = `Posted on: ${formattedDate}`;
    chatElement.appendChild(timestamp);

    const likeButton = document.createElement("button");
    likeButton.textContent = `👍 ${post.likes || 0}`;
    likeButton.classList.add("like-button");
    likeButton.addEventListener("click", () => handleLike(post.id, likeButton));

    const dislikeButton = document.createElement("button");
    dislikeButton.textContent = `👎 ${post.dislikes || 0}`;
    dislikeButton.classList.add("dislike-button");
    dislikeButton.addEventListener("click", () => handleDislike(post.id, dislikeButton));

    chatElement.appendChild(likeButton);
    chatElement.appendChild(dislikeButton);

    const commentsSection = document.createElement("div");
    commentsSection.classList.add("comments");
    commentsSection.style.display = "none";

    if (post.comments && Array.isArray(post.comments)) {
      post.comments.forEach(comment => appendComment(comment, commentsSection, post.username));
    }

    const toggleCommentsBtn = document.createElement("button");
    toggleCommentsBtn.textContent = "See Comments";
    toggleCommentsBtn.addEventListener("click", () => {
      const isHidden = commentsSection.style.display === "none";
      commentsSection.style.display = isHidden ? "block" : "none";
      toggleCommentsBtn.textContent = isHidden ? "Hide Comments" : "See Comments";
    });

    const replyButton = document.createElement("button");
    replyButton.textContent = "Reply";

    const replyForm = document.createElement("form");
    replyForm.style.display = "none";

    const replyInput = document.createElement("textarea");
    replyInput.placeholder = "Write your reply...";
    replyForm.appendChild(replyInput);

    const replySubmit = document.createElement("button");
    replySubmit.type = "submit";
    replySubmit.textContent = "Post Reply";
    replyForm.appendChild(replySubmit);

    replyButton.addEventListener("click", () => {
      replyForm.style.display = replyForm.style.display === "none" ? "block" : "none";
    });

    replyForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const content = replyInput.value.trim();
      if (!content) return;

      try {
        const res = await fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            postId: post.id,
            content,
            username: getUsername(),
            isComment: true
          })
        });

        if (res.ok) {
          const newComment = await res.json();
          appendComment(newComment, commentsSection, post.username);
          replyInput.value = "";
          replyForm.style.display = "none";
          commentsSection.style.display = "block";
          toggleCommentsBtn.textContent = "Hide Comments";
        }
      } catch (err) {
        console.error("Error posting reply:", err);
      }
    });

    chatElement.appendChild(toggleCommentsBtn);
    chatElement.appendChild(commentsSection);
    chatElement.appendChild(replyButton);
    chatElement.appendChild(replyForm);

    chatList.appendChild(chatElement);
  };

  const appendComment = (comment, commentsSection, postOwner) => {
    const commentElement = document.createElement("div");
    commentElement.classList.add("comment");

    const commentUsername = document.createElement("p");
    commentUsername.innerHTML = `${escapeHtml(comment.username)}${comment.username === postOwner ? " <span class='op-tag'>(OP)</span>" : ""}:`;

    const commentContent = document.createElement("p");
    commentContent.textContent = comment.content;

    commentElement.appendChild(commentUsername);
    commentElement.appendChild(commentContent);
    commentsSection.appendChild(commentElement);
  };

  const handleLike = async (postId, button) => {
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, action: "like" })
      });
      if (res.ok) {
        const data = await res.json();
        button.textContent = `👍 ${data.likes || 0}`;
      }
    } catch (err) {
      console.error("Error liking post:", err);
    }
  };

  const handleDislike = async (postId, button) => {
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, action: "dislike" })
      });
      if (res.ok) {
        const data = await res.json();
        button.textContent = `👎 ${data.dislikes || 0}`;
      }
    } catch (err) {
      console.error("Error disliking post:", err);
    }
  };

  createChatForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const content = chatContent.value.trim();
    if (!content) return;

    const username = getUsername();
    let fetchOptions;

    try {
      if (chatImage.files.length > 0) {
        const formData = new FormData();
        formData.append("content", content);
        formData.append("username", username);
        formData.append("image", chatImage.files[0]);

        fetchOptions = { method: "POST", body: formData };
      } else {
        fetchOptions = {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, username })
        };
      }

      const res = await fetch("/api/posts", fetchOptions);
      if (res.ok) {
        const newPost = await res.json();
        createChat(newPost);
        chatContent.value = "";
        chatImage.value = "";
      }
    } catch (err) {
      console.error("Error creating post:", err);
    }
  });

  const escapeHtml = (unsafe) =>
    unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  loadPosts();
});
