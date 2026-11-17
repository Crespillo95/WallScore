"""Create the four original, metre-scaled glTF meshes used by the Lens."""
import json
from pathlib import Path
import struct

DESTINATION = Path(__file__).resolve().parents[1] / "Assets" / "Meshes"


def write_mesh(name, rectangles, color):
    positions, normals, indices = [], [], []
    for x0, y0, x1, y1 in rectangles:
        base = len(positions)
        positions.extend((x / 100, y / 100, 0) for x, y in
                         [(x0, y0), (x1, y0), (x1, y1), (x0, y1)])
        normals.extend([(0, 0, 1)] * 4)
        indices.extend(base + i for i in [0, 1, 2, 2, 3, 0])
    pos = b"".join(struct.pack("<3f", *p) for p in positions)
    norm = b"".join(struct.pack("<3f", *n) for n in normals)
    idx = struct.pack("<" + str(len(indices)) + "H", *indices)
    binary = pos + norm + idx
    tree = {
        "asset": {"version": "2.0", "generator": "WallScore"}, "scene": 0,
        "scenes": [{"nodes": [0]}], "nodes": [{"name": name, "mesh": 0}],
        "meshes": [{"name": name, "primitives": [{"attributes": {"POSITION": 0, "NORMAL": 1},
                    "indices": 2, "material": 0}]}],
        "materials": [{"name": name, "doubleSided": True,
                       "pbrMetallicRoughness": {"baseColorFactor": color + [1], "metallicFactor": 0},
                       "emissiveFactor": color}],
        "buffers": [{"byteLength": len(binary)}],
        "bufferViews": [{"buffer": 0, "byteOffset": offset, "byteLength": length, "target": target}
                        for offset, length, target in [(0, len(pos), 34962),
                        (len(pos), len(norm), 34962), (len(pos) + len(norm), len(idx), 34963)]],
        "accessors": [
            {"bufferView": 0, "componentType": 5126, "count": len(positions), "type": "VEC3",
             "min": list(map(min, zip(*positions))), "max": list(map(max, zip(*positions)))},
            {"bufferView": 1, "componentType": 5126, "count": len(normals), "type": "VEC3"},
            {"bufferView": 2, "componentType": 5123, "count": len(indices), "type": "SCALAR"}]
    }
    encoded = json.dumps(tree, separators=(",", ":")).encode()
    encoded += b" " * (-len(encoded) % 4)
    binary += b"\0" * (-len(binary) % 4)
    chunks = struct.pack("<I4s", len(encoded), b"JSON") + encoded
    chunks += struct.pack("<I4s", len(binary), b"BIN\0") + binary
    (DESTINATION / (name + ".glb")).write_bytes(struct.pack("<4sII", b"glTF", 2, len(chunks) + 12) + chunks)


if __name__ == "__main__":
    DESTINATION.mkdir(parents=True, exist_ok=True)
    stroke = 0.42
    for label, width, height in [("A", 30, 40), ("B", 40, 30), ("C", 24, 36)]:
        x, y = width / 2, height / 2
        write_mesh("Frame" + label, [(-x, -y, x, -y + stroke), (-x, y - stroke, x, y),
                   (-x, -y + stroke, -x + stroke, y - stroke), (x - stroke, -y + stroke, x, y - stroke)],
                   [0.91, 0.97, 0.77])
    write_mesh("HangerCross", [(-1.9, -.2, 1.9, .2), (-.2, .2, .2, 1.9), (-.2, -1.9, .2, -.2)],
               [1, .61, .16])
