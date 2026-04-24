use contracts::YourContract::{IStarkFairDispatcher, IStarkFairDispatcherTrait};
use openzeppelin_access::ownable::interface::{IOwnableDispatcher, IOwnableDispatcherTrait};
use openzeppelin_utils::serde::SerializedAppend;
use snforge_std::{
    CheatSpan, ContractClassTrait, DeclareResultTrait, cheat_caller_address, declare,
    start_cheat_caller_address, stop_cheat_caller_address,
};
use starknet::{ContractAddress, contract_address_const};

fn OWNER() -> ContractAddress {
    contract_address_const::<0x02dA5254690b46B9C4059C25366D1778839BE63C142d899F0306fd5c312A5918>()
}

fn ALICE() -> ContractAddress {
    contract_address_const::<'ALICE'>()
}

fn deploy_contract() -> ContractAddress {
    let contract_class = declare("YourContract").unwrap().contract_class();
    let mut calldata = array![];
    calldata.append_serde(OWNER());
    let (contract_address, _) = contract_class.deploy(@calldata).unwrap();
    contract_address
}

#[test]
fn test_owner_is_set() {
    let address = deploy_contract();
    let ownable = IOwnableDispatcher { contract_address: address };
    assert(ownable.owner() == OWNER(), 'Owner mismatch');
}

#[test]
fn test_add_participants_and_count() {
    let address = deploy_contract();
    let dispatcher = IStarkFairDispatcher { contract_address: address };

    dispatcher.add_participant('alice');
    dispatcher.add_participant('bob');
    dispatcher.add_participant('carol');

    assert(dispatcher.get_participants_count() == 3, 'Count should be 3');
    assert(dispatcher.get_participant(0) == 'alice', 'idx0 alice');
    assert(dispatcher.get_participant(1) == 'bob', 'idx1 bob');
    assert(dispatcher.get_participant(2) == 'carol', 'idx2 carol');
    assert(dispatcher.get_status() == 0, 'status open');
}

#[test]
#[should_panic(expected: 'Duplicate name')]
fn test_duplicate_rejected() {
    let address = deploy_contract();
    let dispatcher = IStarkFairDispatcher { contract_address: address };
    dispatcher.add_participant('alice');
    dispatcher.add_participant('alice');
}

#[test]
#[should_panic(expected: 'Name must be non-zero')]
fn test_empty_name_rejected() {
    let address = deploy_contract();
    let dispatcher = IStarkFairDispatcher { contract_address: address };
    dispatcher.add_participant(0);
}

#[test]
#[should_panic(expected: 'Caller is not the owner')]
fn test_close_requires_owner() {
    let address = deploy_contract();
    let dispatcher = IStarkFairDispatcher { contract_address: address };
    dispatcher.add_participant('alice');

    start_cheat_caller_address(address, ALICE());
    dispatcher.close_and_commit(5);
    stop_cheat_caller_address(address);
}

#[test]
#[should_panic(expected: 'Delay too short')]
fn test_delay_floor() {
    let address = deploy_contract();
    let dispatcher = IStarkFairDispatcher { contract_address: address };
    dispatcher.add_participant('alice');

    cheat_caller_address(address, OWNER(), CheatSpan::TargetCalls(1));
    dispatcher.close_and_commit(1);
}

#[test]
#[should_panic(expected: 'Registration not open')]
fn test_cannot_add_after_close() {
    let address = deploy_contract();
    let dispatcher = IStarkFairDispatcher { contract_address: address };
    dispatcher.add_participant('alice');

    cheat_caller_address(address, OWNER(), CheatSpan::TargetCalls(1));
    dispatcher.close_and_commit(5);

    dispatcher.add_participant('bob');
}

#[test]
#[should_panic(expected: 'Entropy not ready')]
fn test_draw_before_entropy_ready_fails() {
    let address = deploy_contract();
    let dispatcher = IStarkFairDispatcher { contract_address: address };
    dispatcher.add_participant('alice');
    dispatcher.add_participant('bob');

    cheat_caller_address(address, OWNER(), CheatSpan::TargetCalls(1));
    dispatcher.close_and_commit(5);

    dispatcher.draw_winner();
}

#[test]
fn test_reset_bumps_round() {
    let address = deploy_contract();
    let dispatcher = IStarkFairDispatcher { contract_address: address };

    let r0 = dispatcher.get_round_id();
    dispatcher.add_participant('alice');
    assert(dispatcher.get_participants_count() == 1, 'count 1');

    cheat_caller_address(address, OWNER(), CheatSpan::TargetCalls(1));
    dispatcher.reset_round();

    assert(dispatcher.get_round_id() == r0 + 1, 'round bumped');
    assert(dispatcher.get_participants_count() == 0, 'count cleared');
    assert(dispatcher.get_status() == 0, 'reopened');

    // Same name should be acceptable in new round.
    dispatcher.add_participant('alice');
    assert(dispatcher.get_participants_count() == 1, 'alice re-added');
}
