# Manual Gate Node

The **Manual Gate** node is a simple utility that outputs a gate signal. It features a toggle switch that can be used to manually open (gate high) and close (gate low) the gate.

This is useful for manually triggering envelope generators like the `ADSREnvelopeNode`, or for any other module that accepts a gate input.

## Outputs

| Name      | Description                              |
| --------- | ---------------------------------------- |
| **Gate Out** | Outputs a CV signal. When the toggle is on, the signal is high (1.0). When off, the signal is low (0.0). |

## Controls

| Name     | Description                                |
| -------- | ------------------------------------------ |
| **Toggle** | A switch to manually open or close the gate. |
