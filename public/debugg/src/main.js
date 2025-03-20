document.addEventListener("DOMContentLoaded", () => {
  const createChatForm = document.getElementById("create-chat-form");
  const chatList = document.getElementById("chat-list");

  // username cuz what the rizz
  const getUsername = () => {
    let username = localStorage.getItem("username");
    if (!username) {
      username = prompt("Please enter a username:");
      if (username) {
        localStorage.setItem("username", username);
      } else {
        username = "Anonymous";
      }
    }
    return username;
  };

  const loadPosts = async () => {
    const res = await fetch("/api/posts");
    const posts = await res.json();
    posts.forEach(post => createChat(post));
  };

  const createChat = (post) => {
    const chatElement = document.createElement("div");
    chatElement.classList.add("chat");

    const chatContent = document.createElement("p");
    chatContent.innerHTML = `${post.username}: <br> ${post.content}`;
    chatElement.appendChild(chatContent);

    const timestamp = document.createElement("span");
    timestamp.textContent = `Posted on: ${post.timestamp}`;
    chatElement.appendChild(timestamp);

    const seeCommentsButton = document.createElement("button");
    seeCommentsButton.textContent = "See Comments";
    seeCommentsButton.addEventListener("click", () => toggleComments(chatElement));

    const commentsSection = document.createElement("div");
    commentsSection.classList.add("comments");
    post.comments.forEach(comment => {
      const commentElement = document.createElement("div");
      commentElement.classList.add("comment");
      const commentContent = document.createElement("p");
      commentContent.innerHTML = `${comment.username}: <br> ${comment.content}`;
      commentElement.appendChild(commentContent);
      const commentTimestamp = document.createElement("span");
      commentTimestamp.textContent = `Posted on: ${comment.timestamp}`;
      commentElement.appendChild(commentTimestamp);
      commentsSection.appendChild(commentElement);
    });

    const replyButtonContainer = document.createElement("div");
    const replyButton = document.createElement("button");
    replyButton.textContent = "Reply?";
    replyButton.classList.add("reply-button");
    replyButton.addEventListener("click", () => toggleReplyBox(replyButtonContainer));

    const commentForm = document.createElement("form");
    const commentInput = document.createElement("textarea");
    commentInput.placeholder = "Write your comment here...";
    commentInput.required = true;
    commentForm.appendChild(commentInput);

    const commentButton = document.createElement("button");
    commentButton.textContent = "Post Comment";
    commentForm.appendChild(commentButton);

    commentForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = getUsername(); // Get the stored username
      await postComment(post.id, commentInput.value, commentsSection, username);
      commentInput.value = "";
      commentButton.disabled = true; 
    });

    commentInput.addEventListener("input", () => {
      if (commentInput.value.trim()) {
        commentButton.disabled = false;
      } else {
        commentButton.disabled = true;
      }
    });

    chatElement.appendChild(seeCommentsButton);
    chatElement.appendChild(commentsSection);
    chatElement.appendChild(replyButtonContainer);
    replyButtonContainer.appendChild(replyButton);
    replyButtonContainer.appendChild(commentForm);

    chatList.appendChild(chatElement);
  };

  const toggleComments = (chatElement) => {
    const commentsSection = chatElement.querySelector(".comments");
    commentsSection.style.display = commentsSection.style.display === "none" ? "block" : "none";
  };

  const toggleReplyBox = (container) => {
    const replyInput = container.querySelector("textarea");
    const postCommentButton = container.querySelector("button");
    
    replyInput.style.display = "block";
    postCommentButton.disabled = false;
  };

  const postComment = async (postId, content, commentsSection, username) => {
    const res = await fetch(`/api/posts/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, username }), // stringify is a very silly word
    });

    const comment = await res.json();
    const commentElement = document.createElement("div");
    commentElement.classList.add("comment");
    const commentContent = document.createElement("p");
    commentContent.innerHTML = `${comment.username}: <br> ${comment.content}`;
    commentElement.appendChild(commentContent);
    const commentTimestamp = document.createElement("span");
    commentTimestamp.textContent = `Posted on: ${comment.timestamp}`;
    commentElement.appendChild(commentTimestamp);
    commentsSection.appendChild(commentElement);
  };

  createChatForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const chatContent = document.getElementById("chat-content").value.trim();

    if (chatContent) {
      try {
        const username = getUsername();
        const res = await fetch('/api/posts', {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: chatContent, username }), 
        });

        if (!res.ok) {
          throw new Error('Failed to post chat');
        }

        const post = await res.json();
        createChat(post);
        document.getElementById("chat-content").value = "";
      } catch (error) {
        console.error('Error:', error);
      }
    } else {
      alert('Please write something to post!');
    }
  });

  loadPosts();
});
