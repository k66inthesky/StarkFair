import Link from "next/link";

export default function AboutPage() {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>StarkFair - 基於 StarkNet 的出塊的公平抽獎機</h1>
      <p style={styles.section}>
        <strong>作者(學員):</strong>{" "}
        <a href="https://github.com/k66inthesky" target="_blank" rel="noopener noreferrer" style={styles.link}>
          k66
        </a>
      </p>
      <p style={styles.section}>
        <strong>訓練營:</strong> Starknet x TinTin 訓練營
      </p>
      <p style={styles.section}>
        <strong>Boundy繳交日期:</strong> Dec. 23, 2024
      </p>
      <p style={styles.section}>
        <strong>題目:</strong> StarkFair - 基於 StarkNet 的出塊的公平抽獎機
      </p>
      <p style={styles.section}>
        <strong>初衷:</strong> 2024年11月，台灣財政部爆發疑似黑箱抽獎，引起逾10家主流媒體報導。延伸讓我想到做這個題目，一般尋常網頁的抽獎機，程式碼的
        <code>random</code> 函數也許沒那麼隨機(可被反推)也沒有將程式碼開源，因此 StarkFair 就改善以上兩點，利用 Starknet 的出塊數隨機的特性，加上將程式開源分享給社區，以達到世人重視的公平性。
      </p>
      <p style={styles.section}>
        <strong>心得:</strong> 特別感謝開源的 Scaffold-Stark-2 工具，因此我保留了大部分 Scaffold-Stark-2 架構。也感謝 TinTin 的班長Adam、多位老師和同學們。此外，此項目是為了趕進度，望能成為前5名繳交者，還有許多能改進之處，也請大家不吝指教！
      </p>
      <Link href="/lottery">
        <button style={styles.button}>返回抽籤頁面</button>
      </Link>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "800px",
    margin: "0 auto",
    padding: "20px",
    backgroundColor: "#f9f9f9",
    borderRadius: "8px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    fontFamily: "'Arial', sans-serif",
    lineHeight: "1.6",
  },
  title: {
    textAlign: "center",
    fontSize: "24px",
    marginBottom: "20px",
    color: "#333",
  },
  section: {
    marginBottom: "10px",
    color: "#555",
  },
  link: {
    color: "#007bff",
    textDecoration: "none",
  },
  button: {
    display: "block",
    margin: "20px auto 0",
    padding: "10px 20px",
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "16px",
    textAlign: "center",
  },
};
