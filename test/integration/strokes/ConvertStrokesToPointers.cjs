#!/usr/bin/env node
const fs = require('fs')
const strokes = require("./hello.json")
let pointers = []
let arrayPointers = []
time = Date.now()
strokes.forEach(stroke => {
    const length = stroke.x.length
    for(let i=0; i<length; i++) {
        let pointer = {
            "x": stroke.x[i],
            "y": stroke.y[i]     
        }
        if (stroke.t) {
            pointer.t = stroke.t[i]
        }
        if (stroke.p) {
            pointer.p = stroke.p[i]
        }
        pointers.push(pointer)
    }

    const strokePointers = {
        "id": "mouse-" + time,
        "type": "stroke",
        "pointerType": "mouse",
        "pointers": pointers
    }
    time += 100
    arrayPointers.push(strokePointers)
    pointers = []
})
fs.writeFileSync('pointers.json', JSON.stringify(arrayPointers, null, 2))
 

