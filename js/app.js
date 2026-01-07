/************************************************
 * UTILIDADES
 ************************************************/
function getPerguntas() {
  return JSON.parse(localStorage.getItem("perguntas")) || [];
}

function setPerguntas(perguntas) {
  localStorage.setItem("perguntas", JSON.stringify(perguntas));
}

function getRespostas() {
  return JSON.parse(localStorage.getItem("respostas")) || [];
}

function setRespostas(respostas) {
  localStorage.setItem("respostas", JSON.stringify(respostas));
}

/************************************************
 * UPLOAD DE PERGUNTAS (upload.html)
 ************************************************/
const fileInput = document.getElementById("fileInput");
const preview = document.getElementById("preview");

if (fileInput) {
  fileInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const ext = file.name.split(".").pop().toLowerCase();
    let perguntas = [];

    try {
      const conteudo = await file.text();

      if (ext === "json") {
        const parsed = JSON.parse(conteudo);

        if (Array.isArray(parsed)) {
          perguntas = parsed.map(p =>
            typeof p === "string" ? p : p.question || JSON.stringify(p)
          );
        } else if (parsed.questions && Array.isArray(parsed.questions)) {
          perguntas = parsed.questions;
        } else {
          throw new Error("Formato JSON inválido");
        }
      }

      else if (ext === "txt") {
        perguntas = conteudo
          .split(/\r?\n/)
          .map(l => l.trim())
          .filter(l => l !== "");
      }

      else {
        alert("Formato não suportado. Use .txt ou .json");
        return;
      }

      setPerguntas(perguntas);

      preview.innerHTML = "";
      perguntas.forEach((p, i) => {
        const li = document.createElement("li");
        li.textContent = `${i + 1}. ${p}`;
        preview.appendChild(li);
      });

    } catch (err) {
      console.error(err);
      alert("Erro ao importar perguntas");
    }
  });
}

/************************************************
 * FORMULÁRIO (formulario.html)
 ************************************************/
const form = document.getElementById("formulario");

if (form) {
  const perguntas = getPerguntas();

  if (!perguntas.length) {
    form.innerHTML = "<p class='alert alert-warning'>Nenhuma pergunta carregada.</p>";
  } else {
    perguntas.forEach((p, index) => {
      const bloco = document.createElement("div");
      bloco.className = "question-block";

      bloco.innerHTML = `
        <label class="question-title">${p}</label>

        <div class="range-group">
          <span>0</span>
          <input type="range" min="0" max="10" value="5" name="nota_${index}"
            oninput="this.nextElementSibling.textContent=this.value">
          <span class="range-value">5</span>
          <span>10</span>
        </div>

        <textarea
          name="comentario_${index}"
          placeholder="Comentário (opcional)"
          rows="3"></textarea>
      `;

      form.appendChild(bloco);
    });

    const btn = document.createElement("button");
    btn.type = "submit";
    btn.className = "btn btn-success";
    btn.textContent = "Enviar Respostas";
    form.appendChild(btn);
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const respostas = getRespostas();
    const registro = {};

    perguntas.forEach((p, i) => {
      registro[p] = {
        nota: e.target[`nota_${i}`].value,
        comentario: e.target[`comentario_${i}`].value
      };
    });

    respostas.push(registro);
    setRespostas(respostas);

    alert("Respostas salvas com sucesso!");
    e.target.reset();
  });
}

/************************************************
 * RESULTADOS (resultado.html)
 ************************************************/
const tabela = document.getElementById("tabela");

if (tabela) {
  const respostas = getRespostas();

  if (!respostas.length) {
    tabela.innerHTML = "<tr><td>Nenhuma resposta registrada.</td></tr>";
  } else {
    const perguntas = Object.keys(respostas[0]);

    let html = "<thead><tr>";
    perguntas.forEach(p => {
      html += `<th>${p}</th><th>Nota</th><th>Comentário</th>`;
    });
    html += "</tr></thead><tbody>";

    respostas.forEach(r => {
      html += "<tr>";
      perguntas.forEach(p => {
        html += `
          <td>${p}</td>
          <td>${r[p].nota}</td>
          <td>${r[p].comentario}</td>
        `;
      });
      html += "</tr>";
    });

    html += "</tbody>";
    tabela.innerHTML = html;
  }
}

/************************************************
 * EXPORTAÇÃO
 ************************************************/
function exportCSV() {
  const respostas = getRespostas();
  if (!respostas.length) return alert("Nenhum dado para exportar");

  const linhas = [];
  linhas.push("Pergunta,Nota,Comentario");

  respostas.forEach(r => {
    Object.entries(r).forEach(([p, v]) => {
      linhas.push(`"${p}","${v.nota}","${v.comentario}"`);
    });
  });

  const blob = new Blob([linhas.join("\n")], { type: "text/csv" });
  download(blob, "resultado.csv");
}

function exportXLS() {
  const respostas = getRespostas();
  if (!respostas.length) return alert("Nenhum dado para exportar");

  const linhas = [];
  linhas.push("Pergunta\tNota\tComentario");

  respostas.forEach(r => {
    Object.entries(r).forEach(([p, v]) => {
      linhas.push(`${p}\t${v.nota}\t${v.comentario}`);
    });
  });

  const blob = new Blob([linhas.join("\n")], { type: "application/vnd.ms-excel" });
  download(blob, "resultado.xls");
}

function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
