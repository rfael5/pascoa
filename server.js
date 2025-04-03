const express = require('express')
const app = express()
const port = 4001
const sql = require("mssql");
const cors = require('cors');
app.use(cors());
const config = {
    user: "Sa",
    password: "P@ssw0rd2023@#$",
    server: "192.168.1.43",
    database: "SOUTTOMAYOR",
    options: {
        encrypt: false, // ou true, dependendo da sua config
        trustServerCertificate: true,
    },
};


(async () => {
  try {
    await sql.connect(config);
    console.log("✅ Conectado com sucesso ao banco!");
  } catch (err) {
    console.error("❌ Erro na conexão:", err.message);
  }
})();


app.get('/documentos-movimentos', async (req, res) => {
  const { dataInicio, dataFim } = req.query;
  try {
    const result = await sql.query`
      SELECT 
    T1.PK_DOCTOPED,
    T1.TPDOCTO,
    T1.NOME,
    T1.DTPREVISAO,
    T2.RDX_DOCTOPED,
    T2.DESCRICAO,
    T2.UNIDADE,
    T2.L_QUANTIDADE,
    T2.L_PRECOTOTAL,
    T3.CODPRODUTO,
    T3.IDX_NEGOCIO,
    T3.IDX_LINHA
FROM TPADOCTOPED T1
JOIN TPAMOVTOPED T2 ON T1.PK_DOCTOPED = T2.RDX_DOCTOPED
JOIN TPAPRODUTO T3 ON T3.CODPRODUTO = T2.CODPRODUTO
WHERE T1.TPDOCTO IN ('OR', 'EC')
  AND T3.IDX_NEGOCIO IN ('Produtos acabados', 'Desativados')
  And T1.SITUACAO IN ('Z','B','V')
  AND CONVERT(DATE, T1.DTPREVISAO) BETWEEN ${dataInicio} AND ${dataFim}  -- Ajuste com datas de intervalo
ORDER BY T1.PK_DOCTOPED DESC
    `;
    res.json(result.recordset);
  } catch (err) {
    res.status(500).send(`<p>Erro: ${err.message}</p>`);
  }
});





  



app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})