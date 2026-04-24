"use client";

import { useMemo, useState } from "react";
import { Buffer } from "buffer";
import { useAccount, useBlockNumber } from "@starknet-react/core";
import { useScaffoldReadContract } from "~~/hooks/scaffold-stark/useScaffoldReadContract";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-stark/useScaffoldWriteContract";

const STATUS_LABEL: Record<number, string> = {
  0: "報名中 (Open)",
  1: "已截止・等待抽獎區塊 (Committed)",
  2: "已開獎 (Drawn)",
};

function stringToFelt252(s: string): string {
  return BigInt("0x" + Buffer.from(s, "utf8").toString("hex")).toString();
}

function felt252ToString(f: bigint | string | number | undefined): string {
  if (f === undefined) return "";
  const hex = BigInt(f).toString(16);
  if (hex === "0") return "";
  const padded = hex.length % 2 === 0 ? hex : "0" + hex;
  return Buffer.from(padded, "hex").toString("utf8");
}

function Participant({ index }: { index: number }) {
  const { data } = useScaffoldReadContract({
    contractName: "YourContract",
    functionName: "get_participant",
    args: [index],
  } as any);
  const name = felt252ToString(data as any);
  return (
    <li style={styles.listItem}>
      <span style={styles.idx}>#{index}</span> {name || <em>(empty)</em>}
    </li>
  );
}

export default function LotteryPage() {
  const { address } = useAccount();
  const [nameInput, setNameInput] = useState("");
  const [delayInput, setDelayInput] = useState("10");

  const { data: ownerRaw } = useScaffoldReadContract({
    contractName: "YourContract",
    functionName: "owner",
    args: [],
  } as any);
  const { data: statusRaw } = useScaffoldReadContract({
    contractName: "YourContract",
    functionName: "get_status",
    args: [],
  } as any);
  const { data: countRaw } = useScaffoldReadContract({
    contractName: "YourContract",
    functionName: "get_participants_count",
    args: [],
  } as any);
  const { data: entropyBlockRaw } = useScaffoldReadContract({
    contractName: "YourContract",
    functionName: "get_entropy_block",
    args: [],
  } as any);
  const { data: winnerRaw } = useScaffoldReadContract({
    contractName: "YourContract",
    functionName: "get_winner",
    args: [],
  } as any);
  const { data: winnerIndexRaw } = useScaffoldReadContract({
    contractName: "YourContract",
    functionName: "get_winner_index",
    args: [],
  } as any);
  const { data: currentBlock } = useBlockNumber();

  const status = Number(statusRaw ?? 0);
  const count = Number(countRaw ?? 0);
  const entropyBlock = Number(entropyBlockRaw ?? 0);
  const winnerName = felt252ToString(winnerRaw as any);
  const winnerIndex = Number(winnerIndexRaw ?? 0);

  const isOwner = useMemo(() => {
    if (!ownerRaw || !address) return false;
    try {
      return BigInt(ownerRaw as any).toString(16) === BigInt(address).toString(16);
    } catch {
      return false;
    }
  }, [ownerRaw, address]);

  const blocksToWait =
    status === 1 && currentBlock !== undefined
      ? Math.max(0, entropyBlock + 10 - Number(currentBlock))
      : 0;

  const { sendAsync: addParticipant, isPending: addingPending } = useScaffoldWriteContract({
    contractName: "YourContract",
    functionName: "add_participant",
    args: [nameInput ? stringToFelt252(nameInput) : "0"],
  } as any);

  const { sendAsync: closeAndCommit, isPending: closingPending } = useScaffoldWriteContract({
    contractName: "YourContract",
    functionName: "close_and_commit",
    args: [Number(delayInput) || 10],
  } as any);

  const { sendAsync: drawWinner, isPending: drawingPending } = useScaffoldWriteContract({
    contractName: "YourContract",
    functionName: "draw_winner",
    args: [],
  } as any);

  const { sendAsync: resetRound, isPending: resetPending } = useScaffoldWriteContract({
    contractName: "YourContract",
    functionName: "reset_round",
    args: [],
  } as any);

  const handleAdd = async () => {
    if (!nameInput.trim()) {
      alert("請輸入參與者名稱");
      return;
    }
    try {
      await addParticipant();
      setNameInput("");
    } catch (err) {
      console.error(err);
      alert("新增參與者失敗，請檢查錢包與網路");
    }
  };

  const handleClose = async () => {
    try {
      await closeAndCommit();
    } catch (err) {
      console.error(err);
      alert("截止失敗：可能尚未連接 owner 錢包或已截止");
    }
  };

  const handleDraw = async () => {
    try {
      await drawWinner();
    } catch (err) {
      console.error(err);
      alert("開獎失敗：可能尚未到達 entropy 區塊");
    }
  };

  const handleReset = async () => {
    try {
      await resetRound();
    } catch (err) {
      console.error(err);
      alert("重置失敗：僅 owner 可執行");
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>StarkFair 公平抽獎</h1>
      <p style={styles.caption}>
        名單與抽獎結果皆存於鏈上；開獎採 commit-reveal，以未來區塊 hash 作為熵源，任何人（含 owner）都無法預先得知結果。
      </p>

      <div style={styles.statusBar}>
        <div>
          <strong>狀態：</strong>
          {STATUS_LABEL[status] ?? "Unknown"}
        </div>
        <div>
          <strong>參與者數：</strong>
          {count}
        </div>
        {status === 1 && (
          <div>
            <strong>Entropy block：</strong>
            {entropyBlock}（剩 {blocksToWait} 塊）
          </div>
        )}
      </div>

      <div style={styles.section}>
        <h2 style={styles.subtitle}>1. 新增參與者</h2>
        <input
          type="text"
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          placeholder="輸入參與者名稱（例如：alice）"
          style={styles.input}
          disabled={status !== 0}
        />
        <button
          onClick={handleAdd}
          style={{ ...styles.button, opacity: status !== 0 || addingPending ? 0.5 : 1 }}
          disabled={status !== 0 || addingPending}
        >
          {addingPending ? "送出中..." : "新增"}
        </button>
      </div>

      <div style={styles.section}>
        <h2 style={styles.subtitle}>2. 當前參與者（鏈上）</h2>
        {count === 0 ? (
          <p style={styles.muted}>（尚無參與者）</p>
        ) : (
          <ul style={styles.list}>
            {Array.from({ length: count }, (_, i) => (
              <Participant key={i} index={i} />
            ))}
          </ul>
        )}
      </div>

      <div style={styles.section}>
        <h2 style={styles.subtitle}>3. Owner：截止報名並承諾區塊</h2>
        <p style={styles.muted}>
          {isOwner ? "✅ 你是 owner，可操作以下動作。" : "🔒 僅 owner 錢包可操作。"}
        </p>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label>blocks_until_entropy：</label>
          <input
            type="number"
            min={2}
            value={delayInput}
            onChange={(e) => setDelayInput(e.target.value)}
            style={{ ...styles.input, width: 120 }}
            disabled={!isOwner || status !== 0}
          />
          <button
            onClick={handleClose}
            style={{
              ...styles.button,
              opacity: !isOwner || status !== 0 || closingPending ? 0.5 : 1,
            }}
            disabled={!isOwner || status !== 0 || closingPending}
          >
            {closingPending ? "送出中..." : "截止並承諾"}
          </button>
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.subtitle}>4. 任意帳號：開獎</h2>
        <p style={styles.muted}>
          當 current_block ≥ entropy_block + 10 時，任何人都可觸發開獎，結果由鏈上決定。
        </p>
        <button
          onClick={handleDraw}
          style={{
            ...styles.button,
            opacity: status !== 1 || blocksToWait > 0 || drawingPending ? 0.5 : 1,
          }}
          disabled={status !== 1 || blocksToWait > 0 || drawingPending}
        >
          {drawingPending ? "送出中..." : blocksToWait > 0 ? `尚需等 ${blocksToWait} 塊` : "開獎"}
        </button>
      </div>

      {status === 2 && winnerName && (
        <div style={styles.winnerSection}>
          <h2 style={styles.subtitle}>🎉 得獎者</h2>
          <p style={styles.winner}>
            #{winnerIndex}　{winnerName}
          </p>
        </div>
      )}

      <div style={styles.section}>
        <h2 style={styles.subtitle}>5. Owner：開啟下一輪</h2>
        <button
          onClick={handleReset}
          style={{ ...styles.button, opacity: !isOwner || resetPending ? 0.5 : 1 }}
          disabled={!isOwner || resetPending}
        >
          {resetPending ? "送出中..." : "重置 (round+1)"}
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 720,
    margin: "0 auto",
    padding: 24,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    fontFamily: "'Arial', sans-serif",
  },
  title: { textAlign: "center", fontSize: 26, marginBottom: 8, color: "#111" },
  caption: { textAlign: "center", fontSize: 13, color: "#666", marginBottom: 20 },
  statusBar: {
    display: "flex",
    gap: 16,
    flexWrap: "wrap",
    padding: 12,
    backgroundColor: "#eef4ff",
    borderRadius: 6,
    marginBottom: 20,
    fontSize: 14,
  },
  section: { marginBottom: 24 },
  subtitle: { fontSize: 17, marginBottom: 8, color: "#333" },
  muted: { color: "#777", fontSize: 13, marginBottom: 8 },
  input: {
    padding: 10,
    marginRight: 8,
    border: "1px solid #ccc",
    borderRadius: 4,
    fontSize: 15,
    minWidth: 180,
  },
  button: {
    padding: "10px 18px",
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: 15,
  },
  list: { listStyleType: "none", padding: 0 },
  listItem: {
    backgroundColor: "#fff",
    margin: "4px 0",
    padding: 10,
    borderRadius: 4,
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.08)",
  },
  idx: { display: "inline-block", minWidth: 34, color: "#888" },
  winnerSection: {
    marginTop: 20,
    marginBottom: 24,
    padding: 16,
    textAlign: "center",
    backgroundColor: "#fff8e1",
    borderRadius: 6,
  },
  winner: { fontSize: 22, fontWeight: "bold", color: "#d35400" },
};
