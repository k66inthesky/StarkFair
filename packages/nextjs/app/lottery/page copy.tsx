"use client";

import { useState } from "react";
import { Provider, Contract, ec } from "starknet";

const CONTRACT_ADDRESS = "YOUR_CONTRACT_ADDRESS"; // 替換為合約地址
const CONTRACT_METHODS = {
  add_participant: "add_participant",
  draw_winner: "draw_winner",
};

export default function LotteryPage() {
  const [participant, setParticipant] = useState<string>("");
  const [seed, setSeed] = useState<string>("");
  const [winner, setWinner] = useState<string | null>(null);

  const provider = new Provider({ sequencer: { network: "goerli-alpha" } });

  const addParticipant = async () => {
    if (!participant) {
      alert("請輸入參與者名稱！");
      return;
    }

    const feltParticipant = stringToFelt252(participant); // 將名稱轉為 felt252

    try {
      const contract = new Contract(CONTRACT_METHODS, CONTRACT_ADDRESS, provider);
      const response = await contract.add_participant(feltParticipant);
      console.log("新增參與者成功：", response);
      alert(`${participant} 已成功加入抽獎！`);
      setParticipant("");
    } catch (error) {
      console.error("新增參與者失敗：", error);
    }
  };

  const drawWinner = async () => {
    if (!seed) {
      alert("請輸入隨機種子！");
      return;
    }

    try {
      const contract = new Contract(CONTRACT_METHODS, CONTRACT_ADDRESS, provider);
      const result = await contract.draw_winner(parseInt(seed));
      console.log("抽取得獎者成功：", result);
      const winnerName = felt252ToString(result);
      setWinner(winnerName);
    } catch (error) {
      console.error("抽取得獎者失敗：", error);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>抽籤功能展示</h1>

      <div>
        <h2>新增參與者</h2>
        <input
          type="text"
          value={participant}
          onChange={(e) => setParticipant(e.target.value)}
          placeholder="輸入參與者名稱"
        />
        <button onClick={addParticipant}>新增參與者</button>
      </div>

      <div style={{ marginTop: "20px" }}>
        <h2>抽取得獎者</h2>
        <input
          type="number"
          value={seed}
          onChange={(e) => setSeed(e.target.value)}
          placeholder="輸入隨機種子"
        />
        <button onClick={drawWinner}>抽取</button>
      </div>

      {winner && (
        <div style={{ marginTop: "20px" }}>
          <h2>得獎者</h2>
          <p>{winner}</p>
        </div>
      )}
    </div>
  );
}

function stringToFelt252(s: string): string {
  return BigInt("0x" + Buffer.from(s, "utf8").toString("hex")).toString();
}

function felt252ToString(f: string): string {
  const hexString = BigInt(f).toString(16);
  return Buffer.from(hexString, "hex").toString("utf8");
}
