// comments.js (replace the whole file)
function fmt(ts) {
  try { return new Date(ts).toLocaleString("en-AU"); } catch { return ""; }
}
function escapeHtml(s) {
  return String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
}
function renderThread(root, items) {
  root.innerHTML = `
    <div class="cwrap">
      <form class="cform">
        <textarea class="cbody" required placeholder="Write a comment..."></textarea>
        <button type="submit">Post</button>
      </form>
      <div class="clist"></div>
    </div>`;
  const list = root.querySelector(".clist");
  list.innerHTML = items.map(c => `
    <div class="citem" data-id="${c.id}">
      <div class="chead">
        <span class="cname">${escapeHtml((c.author_name || c.author_email) || "")}</span>
        <span class="ctime">${escapeHtml(fmt(c.created_at))}</span>
      </div>
      <div class="cbodytext">${escapeHtml(c.body)}</div>
      <div class="cactions">
        <button class="cedit" type="button">Edit</button>
        <button class="cdel" type="button">Delete</button>
      </div>
    </div>`).join("");
}
async function loadOne(root) {
  const thread = root.dataset.thread;
  const r = await fetch(`/api/comments?thread=${encodeURIComponent(thread)}`);
  const items = await r.json();
  renderThread(root, items);
  const form = root.querySelector(".cform");
  const ta = root.querySelector(".cbody");
  form.onsubmit = async (e) => {
    e.preventDefault();
    await fetch("/api/comments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ thread, page: location.pathname, body: ta.value })
    });
    await loadOne(root);
  };
  root.querySelector(".clist").onclick = async (e) => {
    const item = e.target.closest(".citem");
    if (!item) return;
    const id = item.dataset.id;
    if (e.target.classList.contains("cedit")) {
      const cur = item.querySelector(".cbodytext").textContent;
      const body = prompt("Edit comment:", cur);
      if (body == null) return;
      const resp = await fetch(`/api/comments/${id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body })
      });
      if (resp.ok) await loadOne(root); else alert(await resp.text());
    }
    if (e.target.classList.contains("cdel")) {
      if (!confirm("Delete this comment?")) return;
      const resp = await fetch(`/api/comments/${id}`, { method: "DELETE" });
      if (resp.ok) await loadOne(root); else alert(await resp.text());
    }
  };
}
async function initComments() {
  const blocks = document.querySelectorAll(".comment-thread");
  for (const b of blocks) await loadOne(b);
}
addEventListener("DOMContentLoaded", initComments);
