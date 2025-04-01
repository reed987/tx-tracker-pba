import type {
  API,
  FinalizedEvent,
  IncomingEvent,
  NewBlockEvent,
  NewTransactionEvent,
  OutputAPI,
  Settled,
} from "../types"

export default function yourGhHandle(api: API, outputApi: OutputAPI) {
  const settledTxs = new Set<string>()
  const pendingTxs: string[] = []

  return (event: IncomingEvent) => {
    // Requirements:
    //
    // 1) When a transaction becomes "settled"-which always occurs upon receiving a "newBlock" event-
    //    you must call `outputApi.onTxSettled`.
    //
    //    - Multiple transactions may settle in the same block, so `onTxSettled` could be called
    //      multiple times per "newBlock" event.
    //    - Ensure callbacks are invoked in the same order as the transactions originally arrived.
    //
    // 2) When a transaction becomes "done"-meaning the block it was settled in gets finalized-
    //    you must call `outputApi.onTxDone`.
    //
    //    - Multiple transactions may complete upon a single "finalized" event.
    //    - As above, maintain the original arrival order when invoking `onTxDone`.
    //    - Keep in mind that the "finalized" event is not emitted for all finalized blocks.
    //
    // Notes:
    // - It is **not** ok to make redundant calls to either `onTxSettled` or `onTxDone`.
    // - It is ok to make redundant calls to `getBody`, `isTxValid` and `isTxSuccessful`
    //
    // Bonus 1:
    // - Avoid making redundant calls to `getBody`, `isTxValid` and `isTxSuccessful`.
    //
    // Bonus 2:
    // - Upon receiving a "finalized" event, call `api.unpin` to unpin blocks that are either:
    //     a) pruned, or
    //     b) older than the currently finalized block.

    const onNewBlock = ({ blockHash, parent }: NewBlockEvent) => {

      //TODO add more complex logic

      console.log('Got new block')
      console.log('Got block', blockHash)
      console.log('Got parent', parent)

      const settledState: Settled = {
        blockHash,
        ...(
          { type: "valid", successful: true })
      }
      

      outputApi.onTxSettled(blockHash, settledState)
    }

    const onNewTx = ({ value: transaction }: NewTransactionEvent) => {
      console.log('Got new transaction', transaction)

      if (!settledTxs.has(transaction)) {
        pendingTxs.push(transaction)
      }
    }

    const onFinalized = ({ blockHash }: FinalizedEvent) => {

      //TODO add more complex logic
      console.log('Got Finalized')

      const settledState: Settled = {
        blockHash,
        ...(
          { type: "valid", successful: true })
      }

      outputApi.onTxDone(pendingTxs[0], settledState)

    }

      switch (event.type) {
        case "newBlock": {
          onNewBlock(event)
          break
        }
        case "newTransaction": {
          onNewTx(event)
          break
        }
        case "finalized":
          onFinalized(event)
      }
  }
}
