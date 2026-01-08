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
const container = document.getElementById("questionContainer");
const progressBar = document.getElementById("progressBar");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

if (form && container) {
  const perguntas = JSON.parse(localStorage.getItem("perguntas")) || [];
  let respostas = {};
  let indexAtual = 0;

  if (!perguntas.length) {
    container.innerHTML = "<p>Nenhuma pergunta carregada.</p>";
  } else {
    renderPergunta();
    atualizarProgresso();
  }

  function renderPergunta() {
    const total = perguntas.length;
    const pergunta = perguntas[indexAtual];

    container.className = "fade";
    container.innerHTML = `
      <div class="question-block">
        <label class="question-title">
          ${indexAtual + 1}/${total} – ${pergunta}
        </label>
        
        <div class="range-group">
          <span>0</span>
          <input type="range" min="0" max="10"
            value="${respostas[indexAtual]?.nota ?? 5}"
            oninput="this.nextElementSibling.textContent=this.value">
          <span class="range-value">
            ${respostas[indexAtual]?.nota ?? 5}
          </span>
          <span>10</span>
        </div>

        <textarea placeholder="Comentário (opcional)"
          rows="3">${respostas[indexAtual]?.comentario ?? ""}</textarea>
      </div>
    `;


    
    // Desativa botão Voltar na primeira pergunta
    prevBtn.disabled = indexAtual === 0;
    prevBtn.style.opacity = indexAtual === 0 ? "0.5" : "1";
    prevBtn.style.cursor = indexAtual === 0 ? "not-allowed" : "pointer";

  }

  // função para mostrar o progresso textual com percentual
  function atualizarProgresso() {
    const atual = indexAtual + 1;
    const total = perguntas.length;
    const percentual = Math.round((atual / total) * 100);
    progressBar.style.width = percentual + "%";
    progressText.innerHTML = `
  Pergunta ${atual} de ${total}
  <span class="percentual">(${percentual}%)</span>
`;

  }


  /* função original para a barra de progresso
    function atualizarProgresso() {
      const percentual = ((indexAtual + 1) / perguntas.length) * 100;
      progressBar.style.width = percentual + "%";
   }
  */

  /* Função para mostar o progresso textual
   function atualizarProgresso() {
   const atual = indexAtual + 1;
   const total = perguntas.length;
   const percentual = (atual / total) * 100;
  */

  function salvarResposta() {
    const range = container.querySelector("input[type=range]");
    const textarea = container.querySelector("textarea");

    respostas[indexAtual] = {
      nota: range.value,
      comentario: textarea.value
    };
  }

  nextBtn.addEventListener("click", () => {
    const range = container.querySelector("input[type=range]");
    if (!range) return;

    salvarResposta();

    if (range.value === "") {
      alert("Responda a pergunta antes de avançar.");
      return;
    }

    if (indexAtual < perguntas.length - 1) {
      indexAtual++;
      renderPergunta();
      atualizarProgresso();
    } else {
      const respostasSalvas = JSON.parse(localStorage.getItem("respostas")) || [];
      respostasSalvas.push(respostas);
      localStorage.setItem("respostas", JSON.stringify(respostasSalvas));
      alert("Pesquisa finalizada com sucesso!");
      window.location.href = "resultado.html";
    }
  });

  prevBtn.addEventListener("click", () => {
    if (indexAtual > 0) {
      salvarResposta();
      indexAtual--;
      renderPergunta();
      atualizarProgresso();
    }
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
