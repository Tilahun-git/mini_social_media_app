const API = 'http://localhost:3000/api';
let currentPage = 1;
let isLoading = false;
let allLoaded = false;
let currentUser = null; 
let selectedProfileImageFile = null;
const urlParams = new URLSearchParams(window.location.search);
const isNewPost = urlParams.get('new') === '1';

async function fetchProfile() {
  try {
    const res = await fetch(`${API}/user/profile`, { method: 'POST', credentials: 'include' });
    if (!res.ok) {
      return null;
    }
    const user = await res.json();
    const img = document.getElementById('profileImagePreview');
    if (user.profileImage) {
      img.src = user.profileImage.startsWith('http') ? user.profileImage : `${API.replace('/api','')}${user.profileImage}`;
    } else {
      img.removeAttribute('src');
    }
    return user;
  } catch (err) {
    return null;
  }
}

document.getElementById('profileImageInput').addEventListener('change', function () {
  const file = this.files[0];
  if (file) {
    selectedProfileImageFile = file;
    document.getElementById('profileImagePreview').src = URL.createObjectURL(file);
  }
});

document.getElementById('updateProfileBtn').addEventListener('click', async function () {
  if (!selectedProfileImageFile) {
    alert('Please select an image first.');
    return;
  }
  await updateProfileImage(selectedProfileImageFile);
  currentUser = await fetchProfile();
  selectedProfileImageFile = null;
});

async function updateProfileImage(file) {
  const formData = new FormData();
  formData.append('profileImage', file);
  try {
    const res = await fetch(`${API}/user/update-profile-image`, {
      method: 'put',
      body: formData,
      credentials: 'include'
    });
    let data;
    try {
      data = await res.json();
    } catch (jsonErr) {
      showToast('Server error: Could not parse response', 'error');
      return;
    }
    if (res.ok) {
      showToast('Profile image updated!', 'success');
    } else {
      showToast(data.error || 'Upload failed', 'error');
    }
  } catch (err) {
    showToast('Something went wrong.', 'error');
  }
}

function showToast(message, type = "info", duration = 3000) {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.style.position = "fixed";
    toast.style.bottom = "30px";
    toast.style.left = "50%";
    toast.style.transform = "translateX(-50%)";
    toast.style.zIndex = 9999;
    toast.style.padding = "12px 24px";
    toast.style.borderRadius = "6px";
    toast.style.color = "#fff";
    toast.style.fontSize = "1.1rem";
    toast.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.backgroundColor =
    type === "error" ? "#e74c3c" :
    type === "success" ? "#43a047" :
    type === "warning" ? "#ff9800" :
    type === "info" ? "#1976d2" :
    "#333";
  toast.className = "show";
  toast.style.display = "block";
  setTimeout(() => {
    toast.className = toast.className.replace("show", "");
    toast.style.display = "none";
  }, duration);
}

async function fetchPosts(page = 1, currentUser) {
  if (isLoading || allLoaded) return;
  isLoading = true;
  try {
    const res = await fetch(`${API}/posts?page=${page}`, {
      credentials: 'include',
    });
    const posts = await res.json();
    window.loadedPosts = window.loadedPosts || [];
    window.loadedPosts = window.loadedPosts.concat(posts);
    const container = document.getElementById('posts-container');
    if (posts.length === 0) {
      allLoaded = true;
      return;
    }
    posts.forEach(post => {
      const postEl = createPostElement(post, currentUser);
      container.appendChild(postEl);
    });
    currentPage++;
  } catch (err) {
  } finally {
    isLoading = false;
  }
}

function createPostElement(post, currentUser) {
  const div = document.createElement('div');
  div.className = 'post';
  if (post.text) {
    const text = document.createElement('p');
    text.style.textAlign = 'center';
    text.style.fontSize = '18px';
    text.style.color = '#333';
    text.style.fontWeight = 'bold';
    text.style.marginTop = '10px';
    text.style.padding = '5px';
    text.style.backgroundColor = '#f2f2f2';
    text.style.borderRadius = '8px';
    text.textContent = post.text;
    div.appendChild(text);
  }
  if (post.media) {
    const media =
      post.mediaType === 'image'
        ? document.createElement('img')
        : document.createElement('video');
    media.src = post.media;
    media.className = 'post-media';
    if (post.mediaType === 'video') media.controls = true;
    div.appendChild(media);
  }
  const likeBtn = document.createElement('button');
  likeBtn.textContent = `👍 Like ${post.likes || ''}`;
  likeBtn.className = 'like-btn';
  likeBtn.onclick = () => handleLike(post._id, likeBtn);
  div.appendChild(likeBtn);
  const toggleCommentBtn = document.createElement('button');
  toggleCommentBtn.textContent = "💬 Comment";
  toggleCommentBtn.className = 'comment-btn';
  div.appendChild(toggleCommentBtn);
  let btnGroup = null;
  if (currentUser && post.author && post.author._id === currentUser._id) {
    btnGroup = document.createElement('div');
    btnGroup.className = 'post-btn-group';
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.className = 'delete-post-btn';
    deleteBtn.onclick = async () => {
      const confirmed = await showConfirmDialog('Are you sure you want to delete this post?');
      if (confirmed) {
        const res = await fetch(`/api/posts/${post._id}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        if (res.ok) {
          div.remove();
          showToast('Post deleted!', 'success');
        } else {
          const data = await res.json().catch(() => ({}));
          showToast(data.error || 'Failed to delete post', 'error');
        }
      }
    };
    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.className = 'edit-post-btn';
    editBtn.style.marginRight = '8px';
    editBtn.onclick = () => enterEditMode(div, post, currentUser);
    btnGroup.appendChild(deleteBtn);
    btnGroup.appendChild(editBtn);
    div.appendChild(btnGroup);
  }
  const commentSection = document.createElement('div');
  commentSection.style.display = 'none';
  commentSection.style.marginTop = '10px';
  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Cancel';
  cancelBtn.className = 'cancel-comment-btn';
  cancelBtn.onclick = () => {
    commentSection.style.display = 'none';
    toggleCommentBtn.style.display = 'inline-block';
  };
  const commentList = document.createElement('div');
  commentList.className = 'comment-list';
  commentList.style.maxHeight = '120px';
  commentList.style.overflowY = 'auto';
  commentList.style.marginBottom = '8px';
  const commentInput = document.createElement('textarea');
  commentInput.placeholder = 'Write a comment...';
  commentInput.rows = 2;
  commentInput.style.width = '100%';
  commentInput.style.marginBottom = '5px';
  commentInput.style.borderRadius = '5px';
  commentInput.style.border = '1px solid #ccc';
  commentInput.style.padding = '5px';
  const commentBtn = document.createElement('button');
  commentBtn.textContent = 'Comment';
  commentBtn.disabled = true;
  commentBtn.className = 'comment-btn';
  commentBtn.style.marginTop = '2px';
  commentInput.addEventListener('input', () => {
    commentBtn.disabled = commentInput.value.trim() === '';
  });
  function renderComments(comments) {
    commentList.innerHTML = '';
    if (Array.isArray(comments) && comments.length > 0) {
      [...comments].reverse().forEach(c => {
        const commentDiv = document.createElement('div');
        commentDiv.className = 'single-comment';
        const userHeading = document.createElement('h3');
        userHeading.textContent = c.username || 'User';
        const commentText = document.createElement('p');
        commentText.textContent = c.text;
        const deleteCommentBtn = document.createElement('button');
        deleteCommentBtn.textContent = 'Delete';
        deleteCommentBtn.className = 'delete-comment-btn';
        deleteCommentBtn.onclick = async () => {
          if (confirm('Delete this comment?')) {
            const res = await fetch(`/api/posts/${post._id}/comments/${c._id}`, {
              method: 'DELETE',
              credentials: 'include'
            });
            if (res.ok) {
              post.comments = post.comments.filter(com => com._id !== c._id);
              renderComments(post.comments);
              showToast('Comment deleted!', 'success');
            } else {
              showToast('Failed to delete comment', 'error');
            }
          }
        };
        commentDiv.appendChild(userHeading);
        commentDiv.appendChild(commentText);
        commentDiv.appendChild(deleteCommentBtn);
        commentList.appendChild(commentDiv);
      });
    } else {
      commentList.innerHTML = '<p style="color:gray;">No comments yet</p>';
    }
  }
  toggleCommentBtn.onclick = () => {
    commentSection.style.display = 'block';
    toggleCommentBtn.style.display = 'none';
    renderComments(post.comments);
  };
  commentBtn.onclick = async () => {
    const commentText = commentInput.value.trim();
    if (!commentText) {
      showToast('Please write something before commenting.', 'error');
      return;
    }
    const res = await fetch(`/api/posts/${post._id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ text: commentText })
    });
    if (res.ok) {
      const newComment = await res.json();
      post.comments = post.comments || [];
      post.comments.push(newComment);
      renderComments(post.comments);
      commentInput.value = '';
      commentBtn.disabled = true;
      commentInput.scrollIntoView({ behavior: 'smooth', block: 'end' });
    } else {
      showToast('Failed to add comment', 'error');
    }
  };
  commentSection.appendChild(commentList);
  commentSection.appendChild(commentInput);
  commentSection.appendChild(commentBtn);
  commentSection.appendChild(cancelBtn);
  div.appendChild(commentSection);
  return div;
}

async function fetchAndRenderComments(postId, commentList) {
  const post = window.loadedPosts?.find(p => p._id === postId);
  commentList.innerHTML = '';
  if (post && Array.isArray(post.comments)) {
    post.comments.forEach(c => {
      const li = document.createElement('li');
      li.innerHTML = `<strong>${c.username || 'User'}</strong>: ${c.text} <small style="color:gray;">(${new Date(c.createdAt).toLocaleString()})</small>`;
      commentList.appendChild(li);
    });
  } else {
    commentList.innerHTML = '<li style="color:red;">No comments yet</li>';
  }
}

async function handleComment(postId, text, commentList) {
  if (!text.trim()) {
    showToast('Please write something before commenting.', 'error');
    return false;
  }
  try {
    const commentBtn = commentList.parentElement.querySelector('button');
    if (commentBtn) commentBtn.disabled = true;
    const res = await fetch(`/api/posts/${postId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ text })
    });
    if (!res.ok) {
      showToast('Failed to add comment', 'error');
      if (commentBtn) commentBtn.disabled = false;
      return false;
    }
    showToast('Comment added!', 'success');
    if (commentBtn) commentBtn.disabled = false;
    return true;
  } catch (err) {
    showToast('Error submitting comment', 'error');
    return false;
  }
}

function handleLike(postId, btn) {
  fetch(`${API}/posts/like/${postId}`, {
    method: 'POST',
    credentials: 'include'
  })
    .then(res => res.json())
    .then(updated => {
      btn.textContent = `👍 Like ${updated.likes}`;
    });
}

function logout() {
  fetch(`${API}/auth/logout`, {
    method: 'POST',
    credentials: 'include'
  }).then(() => (window.location.href = '../index.html'));
}

function goToCreatePost() {
  window.location.href = '../createPost/createPost.html';
}

function showConfirmDialog(message) {
  return new Promise((resolve) => {
    let modal = document.getElementById('confirm-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'confirm-modal';
      modal.style.position = 'fixed';
      modal.style.top = '0';
      modal.style.left = '0';
      modal.style.width = '100vw';
      modal.style.height = '100vh';
      modal.style.background = 'rgba(0,0,0,0.25)';
      modal.style.display = 'flex';
      modal.style.alignItems = 'center';
      modal.style.justifyContent = 'center';
      modal.style.zIndex = 10000;
      modal.innerHTML = `
        <div style="background:#fff;padding:28px 32px;border-radius:10px;box-shadow:0 2px 16px rgba(0,0,0,0.18);min-width:260px;text-align:center;">
          <div style="font-size:1.1em;margin-bottom:18px;">${message}</div>
          <button id="confirm-yes" style="background:#e74c3c;color:#fff;border:none;padding:7px 22px;border-radius:4px;font-weight:bold;margin-right:12px;cursor:pointer;">Delete</button>
          <button id="confirm-no" style="background:#eee;color:#333;border:none;padding:7px 22px;border-radius:4px;font-weight:bold;cursor:pointer;">Cancel</button>
        </div>
      `;
      document.body.appendChild(modal);
    } else {
      modal.querySelector('div > div').textContent = message;
      modal.style.display = 'flex';
    }
    modal.querySelector('#confirm-yes').onclick = () => {
      modal.style.display = 'none';
      resolve(true);
    };
    modal.querySelector('#confirm-no').onclick = () => {
      modal.style.display = 'none';
      resolve(false);
    };
  });
}

function enterEditMode(postDiv, post, currentUser) {
  postDiv.innerHTML = '';
  postDiv.classList.add('edit-post-form');
  if (post.media) {
    const flexContainer = document.createElement('div');
    flexContainer.className = 'edit-post-flex';
    const mediaSide = document.createElement('div');
    mediaSide.className = 'edit-post-media';
    const mediaPreview = post.mediaType === 'image'
      ? document.createElement('img')
      : document.createElement('video');
    mediaPreview.src = post.media.startsWith('http') ? post.media : `${API.replace('/api','')}${post.media}`;
    mediaPreview.className = 'post-media';
    if (post.mediaType === 'video') mediaPreview.controls = true;
    mediaSide.appendChild(mediaPreview);
    const controlsSide = document.createElement('div');
    controlsSide.className = 'edit-post-controls';
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*,video/*';
    fileInput.className = 'edit-file-input';
    controlsSide.appendChild(fileInput);
    const textArea = document.createElement('textarea');
    textArea.value = post.text || '';
    textArea.className = 'edit-text-input';
    textArea.rows = 3;
    controlsSide.appendChild(textArea);
    const btnGroup = document.createElement('div');
    btnGroup.className = 'edit-btn-group';
    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Save';
    saveBtn.className = 'save-edit-btn';
    saveBtn.style.marginRight = '8px';
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.className = 'cancel-edit-btn';
    btnGroup.appendChild(saveBtn);
    btnGroup.appendChild(cancelBtn);
    controlsSide.appendChild(btnGroup);
    flexContainer.appendChild(mediaSide);
    flexContainer.appendChild(controlsSide);
    postDiv.appendChild(flexContainer);
    cancelBtn.onclick = () => {
      const newDiv = createPostElement(post, currentUser);
      postDiv.replaceWith(newDiv);
    };
    saveBtn.onclick = async () => {
      const formData = new FormData();
      formData.append('text', textArea.value);
      if (fileInput && fileInput.files[0]) {
        formData.append('media', fileInput.files[0]);
      }
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';
      try {
        const res = await fetch(`/api/posts/${post._id}`, {
          method: 'PUT',
          credentials: 'include',
          body: formData
        });
        if (res.ok) {
          const updatedPost = await res.json();
          const newDiv = createPostElement(updatedPost, currentUser);
          postDiv.replaceWith(newDiv);
          showToast('Post updated!', 'success');
        } else {
          const data = await res.json().catch(() => ({}));
          showToast(data.error || 'Failed to update post', 'error');
          saveBtn.disabled = false;
          saveBtn.textContent = 'Save';
        }
      } catch (err) {
        showToast('Error updating post', 'error');
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save';
      }
    };
  } else {
    const textArea = document.createElement('textarea');
    textArea.value = post.text || '';
    textArea.className = 'edit-text-input';
    textArea.rows = 3;
    postDiv.appendChild(textArea);
    const btnGroup = document.createElement('div');
    btnGroup.className = 'edit-btn-group';
    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Save';
    saveBtn.className = 'save-edit-btn';
    saveBtn.style.marginRight = '8px';
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.className = 'cancel-edit-btn';
    btnGroup.appendChild(saveBtn);
    btnGroup.appendChild(cancelBtn);
    postDiv.appendChild(btnGroup);
    cancelBtn.onclick = () => {
      const newDiv = createPostElement(post, currentUser);
      postDiv.replaceWith(newDiv);
    };
    saveBtn.onclick = async () => {
      const formData = new FormData();
      formData.append('text', textArea.value);
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';
      try {
        const res = await fetch(`/api/posts/${post._id}`, {
          method: 'PUT',
          credentials: 'include',
          body: formData
        });
        if (res.ok) {
          const updatedPost = await res.json();
          const newDiv = createPostElement(updatedPost, currentUser);
          postDiv.replaceWith(newDiv);
          showToast('Post updated!', 'success');
        } else {
          const data = await res.json().catch(() => ({}));
          showToast(data.error || 'Failed to update post', 'error');
          saveBtn.disabled = false;
          saveBtn.textContent = 'Save';
        }
      } catch (err) {
        showToast('Error updating post', 'error');
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save';
      }
    };
  }
}

window.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('posts-container');
  container.innerHTML = '<div id="loading-indicator" style="text-align:center;padding:30px;">Loading...</div>';
  const [profile, posts] = await Promise.all([
    fetchProfile(),
    (async () => {
      const res = await fetch(`${API}/posts?page=1`, { credentials: 'include' });
      return res.json();
    })()
  ]);
  currentUser = profile;
  if (currentUser) {
    const profileDiv = document.querySelector('.profile');
    let nameElem = document.getElementById('profileFullName');
    if (!nameElem) {
      nameElem = document.createElement('div');
      nameElem.id = 'profileFullName';
      nameElem.style.fontWeight = 'bold';
      nameElem.style.fontSize = '1.1em';
      nameElem.style.textAlign = 'center';
      nameElem.style.marginBottom = '6px';
      profileDiv.insertBefore(nameElem, profileDiv.firstChild);
    }
    nameElem.textContent = `${currentUser.firstName} ${currentUser.lastName}`;
  }
  container.innerHTML = '';
  window.loadedPosts = posts;
  posts.forEach(post => {
    const postEl = createPostElement(post, currentUser);
    container.appendChild(postEl);
  });
  currentPage = 2;
  allLoaded = posts.length === 0;
  if (isNewPost) {
    showToast('Your post is created successfully!', 'success', 4000);
  }
  window.addEventListener('scroll', () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
      fetchPosts(currentPage, currentUser);
    }
  });
});
