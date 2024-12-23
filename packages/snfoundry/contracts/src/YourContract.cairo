#[starknet::contract]
mod YourContract {
    use starknet::storage::Map;

    #[storage]
    struct Storage {
        participants: Map<u256, felt252>, // 參與者存儲
        participants_count: u256,        // 參與者數量
    }

    #[constructor]
    fn constructor(ref self: ContractState) {
        self.participants_count.write(0); // 初始化參與者計數
    }

    #[external(v0)] // 修正為支持的外部標註
    fn add_participant(ref self: ContractState, name: felt252) {
        let count = self.participants_count.read();
        self.participants.write(count, name);       // 將參與者新增到 Map
        self.participants_count.write(count + 1);  // 增加計數
    }

    #[external(v0)] // 修正為支持的外部標註
    fn draw_winner(self: @ContractState, seed: u256) -> felt252 {
        let count = self.participants_count.read();
        assert(count > 0, 0); // 修改訊息為錯誤代碼以符合 StarkNet 規範
        let winner_index = seed % count;                     // 基於種子選出索引
        self.participants.read(winner_index)                 // 返回得獎者
    }
}
