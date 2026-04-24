#[starknet::interface]
pub trait IStarkFair<TContractState> {
    fn add_participant(ref self: TContractState, name: felt252);
    fn close_and_commit(ref self: TContractState, blocks_until_entropy: u64);
    fn draw_winner(ref self: TContractState);
    fn reset_round(ref self: TContractState);
    fn get_participant(self: @TContractState, index: u64) -> felt252;
    fn get_participants_count(self: @TContractState) -> u64;
    fn get_status(self: @TContractState) -> u8;
    fn get_entropy_block(self: @TContractState) -> u64;
    fn get_round_id(self: @TContractState) -> u64;
    fn get_winner(self: @TContractState) -> felt252;
    fn get_winner_index(self: @TContractState) -> u64;
}

#[starknet::contract]
pub mod YourContract {
    use core::num::traits::Zero;
    use core::poseidon::poseidon_hash_span;
    use openzeppelin_access::ownable::OwnableComponent;
    use starknet::storage::{
        Map, StorageMapReadAccess, StorageMapWriteAccess, StoragePointerReadAccess,
        StoragePointerWriteAccess,
    };
    use starknet::syscalls::get_block_hash_syscall;
    use starknet::{ContractAddress, SyscallResultTrait, get_block_number, get_block_timestamp};
    use super::IStarkFair;

    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);

    #[abi(embed_v0)]
    impl OwnableMixinImpl = OwnableComponent::OwnableMixinImpl<ContractState>;
    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;

    // Status codes
    pub const STATUS_OPEN: u8 = 0;
    pub const STATUS_COMMITTED: u8 = 1;
    pub const STATUS_DRAWN: u8 = 2;

    // Minimum blocks between commit and the entropy block.
    // The owner cannot see the entropy block hash when committing, so the
    // winner is determined by a future block outside anyone's control.
    pub const MIN_COMMIT_DELAY: u64 = 2;

    // Starknet makes the block hash of a block available once it is at least
    // BLOCK_HASH_BUFFER blocks in the past (10 on mainnet). We require the
    // entropy block to be this deep before anyone can draw.
    pub const BLOCK_HASH_BUFFER: u64 = 10;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
        // Per-round dedup of participant names: (round_id, name) -> registered
        registered: Map<(u64, felt252), bool>,
        // Per-round participant list: (round_id, index) -> name
        participants: Map<(u64, u64), felt252>,
        participants_count: u64,
        round_id: u64,
        status: u8,
        entropy_block: u64,
        winner: felt252,
        winner_index: u64,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        OwnableEvent: OwnableComponent::Event,
        ParticipantAdded: ParticipantAdded,
        RegistrationClosed: RegistrationClosed,
        WinnerDrawn: WinnerDrawn,
        RoundReset: RoundReset,
    }

    #[derive(Drop, starknet::Event)]
    struct ParticipantAdded {
        #[key]
        round_id: u64,
        index: u64,
        name: felt252,
    }

    #[derive(Drop, starknet::Event)]
    struct RegistrationClosed {
        #[key]
        round_id: u64,
        entropy_block: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct WinnerDrawn {
        #[key]
        round_id: u64,
        index: u64,
        name: felt252,
    }

    #[derive(Drop, starknet::Event)]
    struct RoundReset {
        #[key]
        round_id: u64,
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress) {
        self.ownable.initializer(owner);
        self.status.write(STATUS_OPEN);
        self.round_id.write(1);
    }

    #[abi(embed_v0)]
    impl StarkFairImpl of IStarkFair<ContractState> {
        fn add_participant(ref self: ContractState, name: felt252) {
            assert(self.status.read() == STATUS_OPEN, 'Registration not open');
            assert(name.is_non_zero(), 'Name must be non-zero');

            let round = self.round_id.read();
            assert(!self.registered.read((round, name)), 'Duplicate name');

            let count = self.participants_count.read();
            self.participants.write((round, count), name);
            self.registered.write((round, name), true);
            self.participants_count.write(count + 1);
            self.emit(ParticipantAdded { round_id: round, index: count, name });
        }

        fn close_and_commit(ref self: ContractState, blocks_until_entropy: u64) {
            self.ownable.assert_only_owner();
            assert(self.status.read() == STATUS_OPEN, 'Already closed');
            assert(self.participants_count.read() > 0, 'No participants');
            assert(blocks_until_entropy >= MIN_COMMIT_DELAY, 'Delay too short');

            let entropy_block = get_block_number() + blocks_until_entropy;
            self.entropy_block.write(entropy_block);
            self.status.write(STATUS_COMMITTED);
            self.emit(RegistrationClosed { round_id: self.round_id.read(), entropy_block });
        }

        fn draw_winner(ref self: ContractState) {
            assert(self.status.read() == STATUS_COMMITTED, 'Not committed');
            let entropy_block = self.entropy_block.read();
            let current = get_block_number();
            assert(current >= entropy_block + BLOCK_HASH_BUFFER, 'Entropy not ready');

            // Block hash is only available for finalized past blocks, so neither
            // the owner (at commit) nor any caller (at draw) can manipulate it.
            let block_hash = get_block_hash_syscall(entropy_block).unwrap_syscall();

            let round = self.round_id.read();
            let count = self.participants_count.read();
            let count_felt: felt252 = count.into();
            let ts_felt: felt252 = get_block_timestamp().into();

            let entropy = poseidon_hash_span(
                array![block_hash, count_felt, ts_felt, round.into()].span(),
            );
            let entropy_u256: u256 = entropy.into();
            let count_u256: u256 = count.into();
            let idx_u256 = entropy_u256 % count_u256;
            let winner_idx: u64 = idx_u256.try_into().unwrap();
            let winner_name = self.participants.read((round, winner_idx));

            self.winner.write(winner_name);
            self.winner_index.write(winner_idx);
            self.status.write(STATUS_DRAWN);
            self.emit(WinnerDrawn { round_id: round, index: winner_idx, name: winner_name });
        }

        fn reset_round(ref self: ContractState) {
            self.ownable.assert_only_owner();
            // Bumping round_id invalidates the dedup map and participants map
            // without an O(n) sweep — old entries are unreachable via the new id.
            let new_round = self.round_id.read() + 1;
            self.round_id.write(new_round);
            self.participants_count.write(0);
            self.status.write(STATUS_OPEN);
            self.entropy_block.write(0);
            self.winner.write(0);
            self.winner_index.write(0);
            self.emit(RoundReset { round_id: new_round });
        }

        fn get_participant(self: @ContractState, index: u64) -> felt252 {
            self.participants.read((self.round_id.read(), index))
        }

        fn get_participants_count(self: @ContractState) -> u64 {
            self.participants_count.read()
        }

        fn get_status(self: @ContractState) -> u8 {
            self.status.read()
        }

        fn get_entropy_block(self: @ContractState) -> u64 {
            self.entropy_block.read()
        }

        fn get_round_id(self: @ContractState) -> u64 {
            self.round_id.read()
        }

        fn get_winner(self: @ContractState) -> felt252 {
            self.winner.read()
        }

        fn get_winner_index(self: @ContractState) -> u64 {
            self.winner_index.read()
        }
    }
}
