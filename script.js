// ===============================
// 進捗・会議 統合管理ツール script.js
// ===============================

const STORAGE_KEY = "progressManager_v1";

let records = [];
let selectedId = null;
let searchTerm = "";

// ★ ソート状態を追加
let sortKey = "datetime"; // "datetime" | "category" | "admin" | "summary"
let sortDir = "desc";     // "asc" | "desc"

// ユーティリティ：ゼロ埋め
const pad2 = n => String(n).padStart(2, "0");

// ID発行（簡易）
function generateId() {
  return (
    Date.now().toString(36) + Math.random().toString(36).substring(2, 8)
  );
}

// 日時を date/time に分割
function splitDateTime(datetime) {
  if (!datetime) return { date: "", time: "" };
  const [d, t] = datetime.split(" ");
  return { date: d || "", time: t || "" };
}

// DOM取得

const defaultAdminInput = document.getElementById("defaultAdmin");
const saveDefaultAdminBtn = document.getElementById("saveDefaultAdminBtn");

// タブ関連
const tabButtons = document.querySelectorAll(".tab-btn");
const views = document.querySelectorAll(".view");

const dateInput = document.getElementById("dateInput");
const timeInput = document.getElementById("timeInput");
const nowBtn = document.getElementById("nowBtn");
const categorySelect = document.getElementById("categorySelect");
const adminInput = document.getElementById("adminInput");
const membersInput = document.getElementById("membersInput");
const summaryInput = document.getElementById("summaryInput");
const detailInput = document.getElementById("detailInput");
const currentIdInput = document.getElementById("currentId");

const clearFormBtn = document.getElementById("clearFormBtn");
const addBtn = document.getElementById("addBtn");
const updateBtn = document.getElementById("updateBtn");
const deleteBtn = document.getElementById("deleteBtn");

const csvInput = document.getElementById("csvInput");
const exportCsvBtn = document.getElementById("exportCsvBtn");
const loadLocalBtn = document.getElementById("loadLocalBtn");
const saveLocalBtn = document.getElementById("saveLocalBtn");
const clearLocalBtn = document.getElementById("clearLocalBtn");

const recordTableBody = document.querySelector("#recordTable tbody");
const recordCountSpan = document.getElementById("recordCount");
const selectAllCheckbox = document.getElementById("selectAll");
const multiDeleteBtn = document.getElementById("multiDeleteBtn");
const searchInput = document.getElementById("searchInput");

// -------------------------------
// localStorage
// -------------------------------

function saveToLocalStorage(showAlert = true) {
  const payload = {
    records,
    defaultAdmin: defaultAdminInput.value.trim(),
    lastSaved: new Date().toISOString()
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  if (showAlert) {
    alert("localStorageに保存しました。");
  }
}

function loadFromLocalStorage(showAlert = true) {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    if (showAlert) alert("保存されたデータはありません。");
    return;
  }
  try {
    const data = JSON.parse(raw);
    if (Array.isArray(data.records)) {
      records = data.records;
    } else {
      records = [];
    }
    if (data.defaultAdmin) {
      defaultAdminInput.value = data.defaultAdmin;
    }
    renderTable();
    if (showAlert) {
      alert("localStorageから読み込みました。");
    }
  } catch (e) {
    console.error(e);
    if (showAlert) {
      alert("localStorageの読み込みに失敗しました。");
    }
  }
}

// localStorage全消去
function clearLocalStorageAll() {
  if (
    !confirm(
      "このツールで保存したlocalStorageデータをすべて削除します。\n本当に実行しますか？"
    )
  ) {
    return;
  }
  localStorage.removeItem(STORAGE_KEY);
  records = [];
  renderTable();
  clearForm();
  defaultAdminInput.value = "";
  alert("localStorageを削除しました。");
}

// -------------------------------
// フォーム操作
// -------------------------------

function clearForm() {
  currentIdInput.value = "";
  selectedId = null;
  dateInput.value = "";
  timeInput.value = "";
  categorySelect.value = "教員会議";
  adminInput.value = defaultAdminInput.value || "";
  membersInput.value = "";
  summaryInput.value = "";
  detailInput.value = "";

  // テーブルの選択解除
  Array.from(recordTableBody.querySelectorAll("tr")).forEach(tr =>
    tr.classList.remove("selected")
  );
}

function getFormData() {
  const date = dateInput.value;
  const time = timeInput.value;
  if (!date) {
    alert("日付を入力してください。");
    return null;
  }

  const datetime = date + " " + (time || "00:00");

  const admin = adminInput.value.trim();
  const summary = summaryInput.value.trim();

  if (!admin) {
    alert("管理者名を入力してください。");
    return null;
  }
  if (!summary) {
    alert("件名（概要）を入力してください。");
    return null;
  }

  const record = {
    id: currentIdInput.value || generateId(),
    datetime,
    admin,
    members: membersInput.value.trim(),
    category: categorySelect.value,
    summary,
    detail: detailInput.value.trim()
  };

  return record;
}

function setFormFromRecord(record) {
  if (!record) return;
  currentIdInput.value = record.id;
  selectedId = record.id;

  const { date, time } = splitDateTime(record.datetime);
  dateInput.value = date;
  timeInput.value = time;

  categorySelect.value = record.category || "教員会議";
  adminInput.value = record.admin || "";
  membersInput.value = record.members || "";
  summaryInput.value = record.summary || "";
  detailInput.value = record.detail || "";
}

// -------------------------------
// レコード操作
// -------------------------------

function addRecord() {
  const record = getFormData();
  if (!record) return;

  // 既に同じIDがある場合は新しいIDを振る（新規追加なので）
  if (records.some(r => r.id === record.id)) {
    record.id = generateId();
  }

  records.push(record);
  renderTable();
  clearForm();
}

function updateRecord() {
  if (!currentIdInput.value) {
    alert("更新するレコードを一覧から選択してください。");
    return;
  }
  const record = getFormData();
  if (!record) return;

  if (!confirm("このレコードを編集して上書きします。よろしいですか？")) {
    return;
  }

  const idx = records.findIndex(r => r.id === record.id);
  if (idx === -1) {
    alert("対象のレコードが見つかりませんでした。");
    return;
  }

  records[idx] = record;
  renderTable();
  clearForm();
}

function deleteRecord() {
  const id = currentIdInput.value;
  if (!id) {
    alert("削除するレコードを一覧から選択してください。");
    return;
  }
  if (!confirm("このレコードを削除します。よろしいですか？")) {
    return;
  }
  records = records.filter(r => r.id !== id);
  renderTable();
  clearForm();
}

// 複数削除
function multiDeleteRecords() {
  const checkboxes = recordTableBody.querySelectorAll(
    'input.row-select[type="checkbox"]:checked'
  );
  const ids = Array.from(checkboxes).map(cb => cb.value);
  if (!ids.length) {
    alert("削除する行をチェックしてください。");
    return;
  }
  if (
    !confirm(`選択された ${ids.length} 件のレコードを削除します。よろしいですか？`)
  ) {
    return;
  }
  records = records.filter(r => !ids.includes(r.id));
  renderTable();
  clearForm();
}

// -------------------------------
// 検索フィルタ
// -------------------------------
function getFilteredRecords() {
  if (!searchTerm) return [...records];

  const term = searchTerm.toLowerCase();

  return records.filter(r => {
    const text =
      (r.datetime || "") +
      " " +
      (r.category || "") +
      " " +
      (r.admin || "") +
      " " +
      (r.members || "") +
      " " +
      (r.summary || "") +
      " " +
      (r.detail || "");
    return text.toLowerCase().includes(term);
  });
}

// -------------------------------
// ★ ソート処理
// -------------------------------

function sortRecords(arr) {
  const list = [...arr];

  list.sort((a, b) => {
    let av;
    let bv;

    if (sortKey === "datetime") {
      av = a.datetime || "";
      bv = b.datetime || "";
    } else if (sortKey === "category") {
      av = a.category || "";
      bv = b.category || "";
    } else if (sortKey === "admin") {
      av = a.admin || "";
      bv = b.admin || "";
    } else if (sortKey === "summary") {
      av = a.summary || "";
      bv = b.summary || "";
    } else {
      av = "";
      bv = "";
    }

    av = av.toString().toLowerCase();
    bv = bv.toString().toLowerCase();

    if (av < bv) return sortDir === "asc" ? -1 : 1;
    if (av > bv) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  return list;
}

function updateSortIndicators() {
  const ths = document.querySelectorAll("#recordTable th.sortable");
  ths.forEach(th => {
    th.classList.remove("sorted-asc", "sorted-desc");
    const key = th.dataset.sortKey;
    if (key === sortKey) {
      th.classList.add(sortDir === "asc" ? "sorted-asc" : "sorted-desc");
    }
  });
}

// -------------------------------
// テーブル表示
// -------------------------------

function renderTable() {
  // 検索 → ソート
  const filtered = getFilteredRecords();
  const sorted = sortRecords(filtered);

  recordTableBody.innerHTML = "";
  selectAllCheckbox.checked = false;

  sorted.forEach(record => {
    const tr = document.createElement("tr");
    tr.dataset.id = record.id;

    const { date, time } = splitDateTime(record.datetime);

    // チェックボックス列
    const tdCheck = document.createElement("td");
    tdCheck.classList.add("check-col");
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.className = "row-select";
    cb.value = record.id;
    cb.addEventListener("click", e => {
      // チェックボックスクリックで行選択イベントが走らないようにする
      e.stopPropagation();
    });
    tdCheck.appendChild(cb);

    const tdDate = document.createElement("td");
    tdDate.textContent = date;

    const tdTime = document.createElement("td");
    tdTime.textContent = time;

    const tdCat = document.createElement("td");
    tdCat.textContent = record.category || "";

    const tdAdmin = document.createElement("td");
    tdAdmin.textContent = record.admin || "";

    const tdMembers = document.createElement("td");
    tdMembers.textContent = record.members || "";

    const tdSummary = document.createElement("td");
    tdSummary.textContent = record.summary || "";

    tr.append(tdCheck, tdDate, tdTime, tdCat, tdAdmin, tdMembers, tdSummary);

    tr.addEventListener("click", () => {
      // 選択スタイル
      Array.from(recordTableBody.querySelectorAll("tr")).forEach(row =>
        row.classList.remove("selected")
      );
      tr.classList.add("selected");

      const rec = records.find(r => r.id === record.id);
      setFormFromRecord(rec);
    });

    recordTableBody.appendChild(tr);
  });

  recordCountSpan.textContent = `${sorted.length}件（全${records.length}件）`;

  // ★ ソート矢印更新
  updateSortIndicators();
}

// -------------------------------
// CSVエクスポート（File System Access API 対応）
// -------------------------------
async function exportCsv() {
  if (!records.length) {
    alert("エクスポートするデータがありません。");
    return;
  }

  const header =
    "id,datetime,admin,members,category,summary,detail";

  const lines = [header];

  records.forEach(r => {
    const fields = [
      r.id,
      r.datetime,
      r.admin,
      r.members,
      r.category,
      r.summary,
      r.detail
    ].map(v => {
      const text = (v ?? "").replace(/"/g, '""');
      return `"${text}"`; // 全てダブルクォート（改行もOK）
    });

    lines.push(fields.join(","));
  });

  const csvContent = lines.join("\r\n");

  // File System Access API が使える場合（Chrome, Edge など）
  if ("showSaveFilePicker" in window) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: "progress_records.csv",
        types: [
          {
            description: "CSV ファイル",
            accept: { "text/csv": [".csv"] }
          }
        ]
      });

      const writable = await handle.createWritable();
      await writable.write(csvContent);
      await writable.close();
      alert("CSVファイルを保存しました。");
      return;
    } catch (err) {
      if (err && err.name === "AbortError") {
        // ユーザーがキャンセルした場合は何もしない
        return;
      }
      console.error(err);
      alert("ファイル保存中にエラーが発生しました。通常のダウンロード方式に切り替えます。");
      // 下の従来方式にフォールバック
    }
  }

  // 上記が使えない場合は従来通り「ダウンロード」による保存
  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;"
  });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "progress_records.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// -------------------------------
// CSVインポート（ダブルクォート内改行対応）
// -------------------------------

/**
 * テキスト全体を1文字ずつ見て、
 * ・クォート外の「,」でフィールド区切り
 * ・クォート外の改行(\n / \r\n)でレコード区切り
 */
function parseCsvText(text) {
  const rows = [];
  let currentField = "";
  let currentRow = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (ch === '"') {
      // エスケープされた "" → 1つの "
      if (inQuotes && text[i + 1] === '"') {
        currentField += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((ch === "\n" || ch === "\r") && !inQuotes) {
      // 行区切り（クォート外のみ）
      if (ch === "\r" && text[i + 1] === "\n") {
        i++; // CRLFをまとめて consume
      }
      // フィールド確定
      currentRow.push(currentField);
      currentField = "";

      // 空行でなければ rows に追加
      if (currentRow.some(col => col.trim() !== "")) {
        rows.push(currentRow);
      }
      currentRow = [];
    } else if (ch === "," && !inQuotes) {
      // フィールド区切り
      currentRow.push(currentField);
      currentField = "";
    } else {
      currentField += ch;
    }
  }

  // 最後の行
  if (currentField !== "" || currentRow.length) {
    currentRow.push(currentField);
    if (currentRow.some(col => col.trim() !== "")) {
      rows.push(currentRow);
    }
  }

  if (!rows.length) return [];

  // 1行目はヘッダーとして扱う
  const dataRows = rows.slice(1);
  const recordsFromCsv = [];

  for (const cols of dataRows) {
    const [
      id,
      datetime,
      admin,
      members,
      category,
      summary,
      detail
    ] = cols;

    // 完全に空な行はスキップ
    if (
      !id &&
      !datetime &&
      !admin &&
      !members &&
      !category &&
      !summary &&
      !detail
    ) {
      continue;
    }

    recordsFromCsv.push({
      id: id || generateId(),
      datetime: datetime || "",
      admin: admin || "",
      members: members || "",
      // categoryは空のときは空のまま
      category: (category ?? "").trim(),
      summary: summary || "",
      detail: detail || ""
    });
  }

  return recordsFromCsv;
}

function mergeImportedRecords(imported) {
  if (!imported.length) {
    alert("有効なデータがありませんでした。");
    return;
  }

  const duplicated = imported.filter(imp =>
    records.some(r => r.id === imp.id)
  );

  let mode = "1";
  if (duplicated.length > 0) {
    mode =
      prompt(
        `読み込みデータに ${duplicated.length} 件の重複IDがあります。\n` +
          "1: 既存データを優先（新しい方は無視）\n" +
          "2: 新しいデータで上書き\n" +
          "3: 両方残す（新IDを割り当てて追加）\n" +
          "数字を入力してください。",
        "1"
      ) || "1";
  }

  imported.forEach(rec => {
    const idx = records.findIndex(r => r.id === rec.id);
    if (idx === -1) {
      records.push(rec);
    } else {
      if (mode === "1") {
        // 既存優先 → 何もしない
      } else if (mode === "2") {
        // 上書き
        records[idx] = rec;
      } else if (mode === "3") {
        // 両方残す → 新IDに変えて追加
        rec.id = generateId();
        records.push(rec);
      } else {
        // 想定外の入力 → デフォルトで既存優先
      }
    }
  });

  renderTable();
  alert(`CSVから ${imported.length} 件を読み込みました。`);
}

function handleCsvFiles(files) {
  if (!files || !files.length) return;

  const allImported = [];
  let remaining = files.length;

  Array.from(files).forEach(file => {
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target.result;
      const recs = parseCsvText(text);
      allImported.push(...recs);
      remaining--;
      if (remaining === 0) {
        mergeImportedRecords(allImported);
      }
    };
    reader.onerror = () => {
      remaining--;
      if (remaining === 0) {
        if (allImported.length) {
          mergeImportedRecords(allImported);
        } else {
          alert("CSVの読み込みに失敗しました。");
        }
      }
    };
    reader.readAsText(file, "utf-8");
  });
}

// -------------------------------
// タブ切り替え
// -------------------------------

function initTabs() {
  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.dataset.target;

      tabButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      views.forEach(view => {
        if (view.id === targetId) {
          view.classList.add("active");
        } else {
          view.classList.remove("active");
        }
      });
    });
  });
}

// -------------------------------
// ★ ソート用ヘッダ初期化
// -------------------------------
function initSortHeaders() {
  const sortableHeaders = document.querySelectorAll(
    "#recordTable th.sortable"
  );
  sortableHeaders.forEach(th => {
    th.addEventListener("click", () => {
      const key = th.dataset.sortKey;
      if (!key) return;

      if (sortKey === key) {
        // 同じ列なら昇順⇔降順を反転
        sortDir = sortDir === "asc" ? "desc" : "asc";
      } else {
        // 列を切り替えたらキー変更＋方向を初期化
        sortKey = key;
        sortDir = key === "datetime" ? "desc" : "asc"; // 日付だけは新しい順から
      }

      renderTable();
    });
  });
}

// -------------------------------
// イベント設定
// -------------------------------

function setNow() {
  const now = new Date();
  const y = now.getFullYear();
  const m = pad2(now.getMonth() + 1);
  const d = pad2(now.getDate());
  const hh = pad2(now.getHours());
  const mm = pad2(now.getMinutes());

  dateInput.value = `${y}-${m}-${d}`;
  timeInput.value = `${hh}:${mm}`;
}

function initEvents() {
  nowBtn.addEventListener("click", setNow);
  clearFormBtn.addEventListener("click", clearForm);
  addBtn.addEventListener("click", addRecord);
  updateBtn.addEventListener("click", updateRecord);
  deleteBtn.addEventListener("click", deleteRecord);
  multiDeleteBtn.addEventListener("click", multiDeleteRecords);

  // 検索ボックス：入力のたびに絞り込み
  searchInput.addEventListener("input", e => {
    searchTerm = e.target.value;
    renderTable();
  });

  exportCsvBtn.addEventListener("click", () => {
    exportCsv();
  });

  csvInput.addEventListener("change", e => {
    handleCsvFiles(e.target.files);
    // 同じファイルを連続で選べるようにリセット
    csvInput.value = "";
  });

  loadLocalBtn.addEventListener("click", () =>
    loadFromLocalStorage(true)
  );
  saveLocalBtn.addEventListener("click", () =>
    saveToLocalStorage(true)
  );

  saveDefaultAdminBtn.addEventListener("click", () => {
    saveToLocalStorage(false);
    alert("デフォルト管理者名を保存しました。");
  });

  clearLocalBtn.addEventListener("click", clearLocalStorageAll);

  // 全選択チェックボックス
  selectAllCheckbox.addEventListener("change", () => {
    const checked = selectAllCheckbox.checked;
    const rowCheckboxes = recordTableBody.querySelectorAll(
      'input.row-select[type="checkbox"]'
    );
    rowCheckboxes.forEach(cb => {
      cb.checked = checked;
    });
  });

  initTabs();
  initSortHeaders(); // ★ ソートヘッダも初期化
}

// -------------------------------
// 初期化
// -------------------------------

window.addEventListener("DOMContentLoaded", () => {
  loadFromLocalStorage(false); // あれば自動読み込み
  initEvents();
  renderTable();
  clearForm(); // 管理者名だけ初期反映
});
