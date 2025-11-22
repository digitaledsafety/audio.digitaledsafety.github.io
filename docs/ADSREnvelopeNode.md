# ADSR Envelope Node

The **ADSR Envelope** node generates a control signal that follows a standard Attack, Decay, Sustain, and Release path. It is used to shape the characteristics of other nodes, most commonly the volume of a `VCANode`.

The envelope is controlled by an incoming gate signal. When the gate signal goes high, the envelope enters its Attack and Decay phases. It will then remain at the Sustain level for as long as the gate is held high. Once the gate goes low, the envelope enters its Release phase.

## Inputs

| Name      | Description                              |
| --------- | ---------------------------------------- |
| **Gate In** | A CV input that accepts a gate signal to control the envelope's progression. |

## Outputs

| Name      | Description                              |
| --------- | ---------------------------------------- |
| **CV Out**  | The envelope's control signal output.      |

## Controls

| Name          | Description                                |
| ------------- | ------------------------------------------ |
| **Attack (s)**  | The attack time of the envelope in seconds.  |
| **Decay (s)**   | The decay time of the envelope in seconds.   |
| **Sustain**     | The sustain level of the envelope (0-1).     |
| **Release (s)** | The release time of the envelope in seconds. |
