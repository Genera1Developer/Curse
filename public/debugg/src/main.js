document.addEventListener("DOMContentLoaded", () => {
  const createChatForm = document.getElementById("create-chat-form");
  const chatList = document.getElementById("chat-list");

  const getUsername = () => {
    let username = localStorage.getItem("username");
    if (!username) {
      username = prompt("Please enter a username:") || "Anonymous";
      localStorage.setItem("username", username);
    }
    return username;
  };

  const loadPosts = async () => {
    const res = await fetch("/api/posts");
    const posts = await res.json();
    posts.forEach(createChat);
  };

  const createChat = (post) => {
    const chatElement = document.createElement("div");
    chatElement.classList.add("chat");

    const chatContent = document.createElement("p");
    chatContent.innerHTML = `<strong>${post.username}:</strong><br>${post.content}`;
    chatElement.appendChild(chatContent);

    if (post.imageUrl) {
      const image = document.createElement("img");
      image.src = post.imageUrl;
      image.alt = "Posted Image";
      image.classList.add("chat-image");
      chatElement.appendChild(image);
    }

    const timestamp = document.createElement("span");
    timestamp.textContent = `Posted on: ${post.timestamp}`;
    chatElement.appendChild(timestamp);

    
    const likeButton = document.createElement("button");
    likeButton.textContent = `👍 ${post.likes || 0}`;
    likeButton.addEventListener("click", () => handleLikeDislike(post.id, "like", likeButton, dislikeButton));

    const dislikeButton = document.createElement("button");
    dislikeButton.textContent = `👎 ${post.dislikes || 0}`;
    dislikeButton.addEventListener("click", () => handleLikeDislike(post.id, "dislike", likeButton, dislikeButton));

    chatElement.appendChild(likeButton);
    chatElement.appendChild(dislikeButton);

    const seeCommentsButton = document.createElement("button");
    seeCommentsButton.textContent = "See Comments";
    seeCommentsButton.addEventListener("click", () => toggleComments(commentsSection));

    const commentsSection = document.createElement("div");
    commentsSection.classList.add("comments");
    commentsSection.style.display = "none";

    post.comments.forEach((comment) => {
      commentsSection.appendChild(createCommentElement(comment, post.username));
    });

    const replyButtonContainer = document.createElement("div");
    const replyButton = document.createElement("button");
    replyButton.textContent = "Reply?";
    replyButton.classList.add("reply-button");
    replyButton.addEventListener("click", () => toggleReplyBox(replyButtonContainer));

    const commentForm = document.createElement("form");
    commentForm.style.display = "none";
    const commentInput = document.createElement("textarea");
    commentInput.placeholder = "Write your comment here...";
    commentInput.required = true;

    const commentButton = document.createElement("button");
    commentButton.textContent = "Post Comment";
    commentButton.disabled = true;

    commentForm.appendChild(commentInput);
    commentForm.appendChild(commentButton);

    commentForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = getUsername();
      await postComment(post.id, commentInput.value, commentsSection, username, post.username);
      commentInput.value = "";
      commentButton.disabled = true;
    });

    commentInput.addEventListener("input", () => {
      commentButton.disabled = !commentInput.value.trim();
    });

    chatElement.appendChild(seeCommentsButton);
    chatElement.appendChild(commentsSection);
    replyButtonContainer.appendChild(replyButton);
    replyButtonContainer.appendChild(commentForm);
    chatElement.appendChild(replyButtonContainer);
    chatList.appendChild(chatElement);
  };

  const createCommentElement = (comment, postOwner) => {
    const commentElement = document.createElement("div");
    commentElement.classList.add("comment");

    let opTag = comment.username === postOwner ? " <span class='op-tag'>{OP}</span>" : "";
    const commentContent = document.createElement("p");
    commentContent.innerHTML = `<strong>${comment.username}${opTag}:</strong><br>${comment.content}`;
    commentElement.appendChild(commentContent);

    const commentTimestamp = document.createElement("span");
    commentTimestamp.textContent = `Posted on: ${comment.timestamp}`;
    commentElement.appendChild(commentTimestamp);

    return commentElement;
  };

  const toggleComments = (commentsSection) => {
    commentsSection.style.display = commentsSection.style.display === "none" ? "block" : "none";
  };

  const toggleReplyBox = (container) => {
    const form = container.querySelector("form");
    form.style.display = form.style.display === "none" ? "block" : "none";
  };

  const handleLikeDislike = async (postId, type, likeButton, dislikeButton) => {
    const res = await fetch(`/api/posts/${postId}/${type}`, { method: "POST" });
    if (res.ok) {
      const updatedPost = await res.json();
      likeButton.textContent = `👍 ${updatedPost.likes}`;
      dislikeButton.textContent = `👎 ${updatedPost.dislikes}`;
    }
  };

  const postComment = async (postId, content, commentsSection, username, postOwner) => {
    const res = await fetch(`/api/posts/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, username }),
    });

    if (res.ok) {
      const comment = await res.json();
      commentsSection.appendChild(createCommentElement(comment, postOwner));
    }
  };

  createChatForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const chatContent = document.getElementById("chat-content").value.trim();
    const imageInput = document.getElementById("chat-image");

    if (chatContent || (imageInput && imageInput.files.length > 0)) {
      const username = getUsername();
      const formData = new FormData();
      formData.append("content", chatContent);
      formData.append("username", username);
      if (imageInput.files.length > 0) {
        formData.append("image", imageInput.files[0]);
      }

      try {
        const res = await fetch("/api/posts", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          throw new Error("Failed to post chat");
        }

        const post = await res.json();
        createChat(post);
        document.getElementById("chat-content").value = "";
        imageInput.value = "";
      } catch (error) {
        console.error("Error:", error);
      }
    } else {
      alert("bastard.");
    }
  });

  loadPosts();
});
