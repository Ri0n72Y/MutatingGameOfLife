# Interaction Statement

Write your interaction statement here (max 500 words).

To Click anywhere in canvas, you could create a white dot "cell", white color means the cell is just spawned. You could change your pointer by select dot color in tool bar at the bottom.

All cells obey the rules of Convey's Game of Life.

Colored cells also obey other rules:
 - **1**, Colored cell could be state "matched", given by condition 2;
 - **2**, a cell has at least 1 neighbour that could match with it, red cells match with yellow cells, blue cells match with green cells;
 - **3**, if a cell is matched, it will live under-population, i.e., it could keep alive when the number of neighbours less than or equal to 3 (configurable, see below); 

Tool bar has many bottons like remote control by Parasonic, but I believe they are easy to understand and remember:

*If you cannot see some characters, please use browser that support utf-8 or utf-32*

 - ⏵: Play, or Pause ⏸, it controls generation steps. You could pause and add/delete cells, then see what happen in the next generation;
 - ↻: Clear, it will remove everything from board, all cells dead, it is really useful even it sounds ruthless;
 - ?: Help, it will open the help window. There is a small button somewhere, open this document;
 - ⏺: the dots change your drawing color, then you could try different color matching;
 - ⛆: Random generate cells on the screen, they are real cells,
 - ☄: Drop, random generate cells in a circle at center of the screen. Compare with above, it gives higher density and a shape, just like you put a drop of cells in liquid;
 - ⌗: Grid, control on/off
 - ◑: Faster Mode, due to p5 rendering method, if you scale to very large area, the framerate would be extremely slow, by turn on it, canvas will looks faster;
 - 🧬: Life behaviours, default enabled. Let colored cell behave a little different than the original GOL, turn off for the original GOL experience;
 - 3|4|5|6: control the available maximun number of neighbours the "matched" cell still living, default 3. Try it and you will see something very interesting;
 - 🗲: Speed of rendering, generation per seconds. If there are too many cells on the board, it could be very slow;
 - 🔍: scale size, see detail of each cell, watch whole structue of cell group.