async function loadComments() {
  const el = document.getElementById("comments");
  const page = el.dataset.page;

  const r = await fetch(`/api/comments?page=${encodeURIComponent(page)}`);
  const items = await r.json();

  el.innerHTML =
    `<form id="cform">
       <textarea id="cbody" required></textarea>
       <button type="submit">Post</button>
     </form>
     <div id="clist"></div>`;

  const list = document.getElementById("clist");

  list.innerHTML = items.map(c =>
    `<div data-id="${c.id}">
       <div>${(c.author_name || c.author_email) || ""}</div>
       <div class="body">${escapeHtml(c.body)}</div>
       <button class="edit">Edit</button>
       <button class="del">Delete</button>
     </div>`
  ).join("");

  document.getElementById("cform").onsubmit = async e => {
    e.preventDefault();
    await fetch("/api/comments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ page, body: document.getElementById("cbody").value })
    });
    loadComments();
  };

  list.onclick = async e => {
    const wrap = e.target.closest("[data-id]");
    if (!wrap) return;
    const id = wrap.dataset.id;

    if (e.target.classList.contains("edit")) {
      const cur = wrap.querySelector(".body").textContent;
      const body = prompt("Edit comment:", cur);
      if (body == null) return;
      const resp = await fetch(`/api/comments/${id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body })
      });
      if (resp.ok) loadComments(); else alert(await resp.text());
    }

    if (e.target.classList.contains("del")) {
      if (!confirm("Delete this comment?")) return;
      const resp = await fetch(`/api/comments/${id}`, { method: "DELETE" });
      if (resp.ok) loadComments(); else alert(await resp.text());
    }
  };
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceA
