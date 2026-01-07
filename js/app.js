//DADOS
let perguntas = JSON.parse(localStorage.getItem("perguntas"))||[];
let respostas = JSON.parse(localStorage.getItem("respostas"))||[];


//UPLOAD   
// UPLOAD
const fileInput = document.getElementById("fileInput");
if (fileInput) {
  fileInput.addEventListener("change", async (e) => {
    console.log("Arquivo selecionado:", e.target.files);
    const file = e.target.files[0];
    if (!file) return;

    const ext = file.name.split(".").pop().toLowerCase();
    const txt = await file.text();

    if (ext === "json") {
      perguntas = JSON.parse(txt);
    } 
    else if (ext === "txt") {
      perguntas = txt.split(/\r?\n/).filter(Boolean);
    } 
    else {
      alert("Formato do arquivo não é válido. Use .txt ou .json");
      return;
    }

    localStorage.setItem("perguntas", JSON.stringify(perguntas));
    renderPreview();
  });
}


//PREVIEW
function renderPreview(){
    const preview = document.getElementById("preview");
    if(!preview) return;

    preview.innerHTML = "";
    perguntas.forEach(p => {
         preview.innerHTML += `<li class="list-group-item">${p}</li>`;     
    });
}


//FORMULARIO
const form = document.getElementById("formulario");
if (form) {
  if (perguntas.length === 0) {
    form.innerHTML = "<p>Nenhuma pergunta carregada.</p>";
  } else {
    perguntas.forEach((p, i) => {
      form.innerHTML += `
        <div class="mb-3">
          <label class="form-label">${p}</label>
          <input class="form-control" name="q${i}" required>
        </div>
      `;
    });

    form.innerHTML += `<button class="btn btn-success">Enviar</button>`;

    form.onsubmit = (e) => {
      e.preventDefault();
      const data = {};
      perguntas.forEach((p, i) => {
        data[p] = form[`q${i}`].value;
      });
      respostas.push(data);
      localStorage.setItem("respostas", JSON.stringify(respostas));
      alert("Resposta salva!");
      form.reset();
    };
  }
}

//RESULTADO
const table = document.getElementById("tabela");
if (table) {
  const respostas = JSON.parse(localStorage.getItem("respostas")) || [];

  if (respostas.length === 0) {
    table.innerHTML = "<tr><td>Nenhuma resposta registrada.</td></tr>";
  } else {
    const headers = Object.keys(respostas[0]);
    table.innerHTML = `
      <thead>
        <tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr>
      </thead>
      <tbody>
        ${respostas.map(r =>
          `<tr>${headers.map(h => `<td>${r[h]}</td>`).join("")}</tr>`
        ).join("")}
      </tbody>
    `;
  }
}

//EXPORTAÇÃO CSV
function exportCSV() {
  if (!respostas.length) return alert("Sem dados");

  const headers = Object.keys(respostas[0]);
  const rows = respostas.map(r => headers.map(h => `"${r[h]}"`).join(","));
  const csv = [headers.join(","), ...rows].join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "resultado.csv";
  a.click();
}

// EXPORTAÇÃO XLS
function exportXLS() {
  const respostas = JSON.parse(localStorage.getItem("respostas")) || [];
  if (respostas.length === 0) {
    alert("Nenhuma resposta para exportar.");
    return;
  }

  const headers = Object.keys(respostas[0]);
  const linhas = [];

  // Cabeçalho
  linhas.push(headers.join("\t"));

  // Dados
  respostas.forEach(r => {
    linhas.push(headers.map(h => r[h]).join("\t"));
  });

  const conteudo = linhas.join("\n");
  const blob = new Blob([conteudo], {
    type: "application/vnd.ms-excel"
  });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "resultado.xls";
  a.click();
}
