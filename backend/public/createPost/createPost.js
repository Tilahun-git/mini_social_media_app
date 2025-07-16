
 const API = 'http://localhost:3000/api';

    async function submitPost() {
      const text = document.getElementById('postText').value.trim();
      const mediaFile = document.getElementById('mediaUpload').files[0];

      if (!text && !mediaFile) {
        alert('Please write something or upload media.');
        return;
      }

      const formData = new FormData();
      formData.append('text', text);
      if (mediaFile) formData.append('media', mediaFile);

      try {
        const res = await fetch(`${API}/posts/create-post`, {
          method: 'POST',
          body: formData,
          credentials: 'include'
        });

        const data = await res.json();

        if (res.ok) {
          window.location.href = '../home/home.html?new=1'; // Redirect with flag
        } else {
          alert(data.error || 'Post failed.');
        }
      } catch (err) {
        console.error('Post error:', err);
      }
    }

function cancelCreatePost() {
  window.location.href = '../home/home.html';
}
