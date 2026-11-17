---
status: draft
---

# WallScore

The entrant selected a mounting guide and a demo for Learn AR with SPECS. The design below develops that direction with the official plan-lens planning template. Dimensions and interaction choices are proposed defaults. Native build and preview sign-off are pending.

## The one spatial moment

An installer looks at three differently sized frames on the same wall, opens the gaps, and reveals three hanger points without losing the arrangement. The frames share a visual centre line while their hooks sit at three different heights.

## Why it belongs on glasses

The outlines stay on the wall as the installer steps sideways. With the composition visible at full scale, both hands are available to hold a real picture or a tape measure. The horizontal positions of the marks change immediately when the spacing changes.

## Product or overlay

A spatial overlay for a flat wall. The planned preview uses a fixed, labelled sample wall with a known origin and dimensions. The default recording layout uses one central hanger per frame.

## Where things live

- The centre of the arrangement sits 150 cm above a simulated floor on a 240 cm wall (default). Place the initial viewpoint far enough back to see all three outlines and the controls, and let the user step closer for detail.
- Frame A is 30 × 40 cm, B is 40 × 30 cm, C is 24 × 36 cm (default). Layout starts with an 8 cm gap. Maintain equal side margins and equal edge gaps at all spacing settings.
- Draw luminous corners, a thin centre line and an A/B/C label on the wall. In mark view, each point gets a cross and its reference distances from the left edge and floor. For legibility, show a detailed readout only for the selected frame (initially B).
- Aim for high-contrast cream outlines with amber hooks. Pair colour with distinct outlines and cross shapes. Anchor controls under B, where the user is already looking.

## Hands and input

One large “Gap” control cycles 8 → 12 → 4 → 8 cm (default). “Show marks” locks the layout and reveals the three markers. Select any marker for its coordinates; “Edit layout” restores the previous gap. Use standard single-pinch controls with hover feedback and a mouse equivalent in Interactive Preview.

## When things show

The wall begins in layout mode. Show the gap readout beside the centre line. While marks are visible, dim the frame outlines, hide the gap control and leave the edit control visible. A local highlight follows the selected mark. No voice, recording, networking or tracking of people.

## Done criteria

1. On launch, the simulated wall shows three life-size outlines at the same centre height and an 8 cm edge gap.
2. Press Gap once. Both gaps become 12 cm and the three centres are 76, 123 and 167 cm from the left wall edge. Cycle twice more to return to 8 cm.
3. At 8 cm, press Show marks. Crosses appear at A (80, 166), B (123, 162), C (163, 163), in centimetres from the wall's left edge and floor. Selecting each cross reveals its own readout.
4. Step sideways in preview. The guides and marks keep their places relative to the wall. Return to layout and confirm the chosen spacing persists without accumulating offsets.

## Out of scope

Automatic registration of a real wall, persistent anchors across sessions and fastening advice by wall material.

## Additional mounting configurations

The bilingual companion accepts centred, off-centre and dual supports, with a separate top offset for each. It saves editable plans and prints the marks. The controller accepts the saved JSON through its Inspector input and preserves the measured spacing. Its mixed-hardware preset uses two supports on B at (108, 162) and (138, 161) cm, and one on C at (159, 163) cm. The second pinch on a selected two-support frame cycles between support points. These configurations have local geometry and controller tests. Editor assembly and on-device evaluation are pending.

## Risks and open questions

Physical alignment accuracy and prolonged viewing comfort need real-device evaluation. Use a tape measure before transferring an actual mark. Native interaction, visibility and world anchoring must be checked in the editor before recording.

## Build notes for CLAD
- Build for SPECS so it runs and can be demonstrated in Lens Studio's preview. No SPECS device is available.
- Use Spectacles Interaction Kit (SIK) and UI Kit for all interactions, so they work with the mouse in Interactive Preview and with LEAF.
- Build any stand-in exactly as described above, and keep it obvious in the scene.
- Use real-world scale in centimeters. Keep content inside the user's view during the main task.
- The display is additive: black renders as transparent. Don't rely on black or very dark content to be seen; keep text light and readable from where the user stands.
- Get the basic flow working first, then add detail.
- Write LEAF scenarios for each done criterion, run them in preview, and report which pass. Say which criteria have no test.
- Don't record, identify, or follow people.

## After the build: judge it
This part is for you, after CLAD finishes.

1. **Does it work?** Ask your agent which LEAF tests passed and which done criteria have no test.
2. **Walk around it.** Open the preview in Interactive Preview. Use WASD to move, Q and E to go down and up, and right-drag (or hold Shift) to look around. Clicking acts as a pinch. Stand where a user would and look at the task.
3. **Ask the three questions.**
   - Does it use what I'm looking at?
   - Does it put something in my space, where it belongs?
   - Does it free my hands or let me keep my eyes up?
   - Would it be just as good on a phone? If so, what would make it need the glasses?
4. **Check comfort.**
   - Everything I need is in view while I do the task. Nothing sits at the edges, behind me, or stuck to my face.
   - Every control is within reach of someone standing there.
   - Text reads easily from where I stand. No dark UI disappearing.
   - Things show when needed and get out of the way.
5. **Label what you know.** Write "logic proven" next to anything the tests and preview show working, and "feel unproven" next to anything only real glasses could tell you (comfort over time, real hand tracking, real recognition).
6. **Fix with design notes, not code.** Tell your agent what to change in design terms, for example: "Move the step card 15 cm lower and next to the pan. Make the Next button twice as big. Re-run the tests." If a fix takes under a minute, like nudging a panel, do it yourself in the scene.
7. **Submit.** Record a video under 3 minutes of your Lens in the preview, public on YouTube. Make your repo public with your Lens Studio project and this `devpost/` folder. Details are on the hackathon site: https://learn-specs.devpost.com/resources

