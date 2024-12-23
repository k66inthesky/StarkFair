"use client";

import { useState } from "react";
import { Provider } from "starknet";
import { Buffer } from "buffer";
import contractAbi from "/../snfoundry/deployments/devnet_latest.json";

// 硬編碼的合約地址（替換為您的實際合約地址）
const CONTRACT_ADDRESS = contractAbi.YourContract.address;

export default function LotteryPage() {
  const [participant, setParticipant] = useState<string>(""); // 单个参与者的输入
  const [participants, setParticipants] = useState<string[]>([]); // 所有参与者列表
  const [winner, setWinner] = useState<string | null>(null); // 定义 winner 状态

  const provider = new Provider({ sequencer: { network: "sepolia" } });

  const addParticipant = async () => {
    if (!participant) {
      alert("请输入参与者名称！");
      return;
    }

    try {
      const feltParticipant = stringToFelt252(participant);
      const blockNo = await provider.getBlockNumber();
      console.log("新增参与者成功：", feltParticipant, "; Block No: ", blockNo);

      setParticipants((prev) => [...prev, participant]);
      alert(`${participant} 已成功加入抽奖！`);
      setParticipant("");
    } catch (error) {
      console.error("新增参与者失败：", error);
      alert("新增参与者失败，请检查控制台日志。");
    }
  };

  const drawWinner = async () => {
    if (participants.length === 0) {
      alert("没有参与者，无法抽奖！");
      return;
    }

    try {
      const blockNumber = await provider.getBlockNumber();
      const randomIndex = blockNumber % participants.length;
      const winnerName = participants[randomIndex];

      setWinner(winnerName);
      console.log("抽取得奖者成功：", winnerName, "; Block No: ", blockNumber);
    } catch (error) {
      console.error("抽取得奖者失败：", error);
      alert("抽取得奖者失败，请检查控制台日志。");
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>抽籤功能展示</h1>

      <div style={styles.section}>
        <h2 style={styles.subtitle}>新增參與者</h2>
        <input
          type="text"
          value={participant}
          onChange={(e) => setParticipant(e.target.value)}
          placeholder="輸入參與者名稱"
          style={styles.input}
        />
        <button onClick={addParticipant} style={styles.button}>
          新增參與者
        </button>
      </div>

      <div style={styles.section}>
        <h2 style={styles.subtitle}>當前參與者</h2>
        <ul style={styles.list}>
          {participants.map((name, index) => (
            <li key={index} style={styles.listItem}>
              {name}
            </li>
          ))}
        </ul>
      </div>

      <div style={styles.section}>
        <h2 style={styles.subtitle}>抽取得獎者</h2>
        <button onClick={drawWinner} style={styles.button}>
          抽取
        </button>
      </div>

      {winner && (
        <div style={styles.winnerSection}>
          <h2 style={styles.subtitle}>得獎者</h2>
          <p style={styles.winner}>{winner}</p>
        </div>
      )}
    </div>
  );
}

// 工具函数：字符串转换为 felt252
function stringToFelt252(s: string): string {
  return BigInt("0x" + Buffer.from(s, "utf8").toString("hex")).toString();
}

function felt252ToString(f: string): string {
  const hexString = BigInt(f).toString(16);
  return Buffer.from(hexString, "hex").toString("utf8");
}

const styles = {
  container: {
    maxWidth: "600px",
    margin: "0 auto",
    padding: "20px",
    backgroundColor: "#f9f9f9",
    borderRadius: "8px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    fontFamily: "'Arial', sans-serif",
  },
  title: {
    textAlign: "center",
    fontSize: "24px",
    marginBottom: "20px",
    color: "#333",
  },
  section: {
    marginBottom: "20px",
  },
  subtitle: {
    fontSize: "18px",
    marginBottom: "10px",
    color: "#555",
  },
  input: {
    width: "100%",
    padding: "10px",
    marginBottom: "10px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    fontSize: "16px",
  },
  button: {
    padding: "10px 20px",
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "16px",
  },
  list: {
    listStyleType: "none",
    padding: 0,
  },
  listItem: {
    backgroundColor: "#fff",
    margin: "5px 0",
    padding: "10px",
    borderRadius: "4px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
  },
  winnerSection: {
    marginTop: "20px",
    textAlign: "center",
  },
  winner: {
    fontSize: "20px",
    fontWeight: "bold",
    color: "#007bff",
  },
};
