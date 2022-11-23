const hStrokes = require('./strokes/h.json')
module.exports.h = {
  type: 'TEXT',
  strokes: hStrokes,
  exports: {
    'text/plain': ['h'],
    'application/vnd.myscript.jiix': {
      type: 'Text',
      label: 'h',
      words: [
        {
          label: 'h',
          candidates: ['h', 'k', 'hi', 'he', 'hr'],
        },
      ],
      version: '3',
      id: 'MainBlock',
    },
  },
}

const helloStrokes = require('./strokes/hello.json')
module.exports.hello = {
  type: 'TEXT',
  strokes: helloStrokes,
  exports: {
    'text/plain': ['h', 'he', 'hel', 'hell', 'hello'],
    'application/vnd.myscript.jiix': {
      type: 'Text',
      label: 'hello',
      words: [
        {
          label: 'hello',
          candidates: ['hello', 'kello', 'helloo', 'hellor', 'hello'],
        },
      ],
      version: '3',
      id: 'MainBlock',
    },
  },
}

const helloStrike = require('./strokes/helloStrike.json')
module.exports.helloStrikeStroke = {
  name: 'helloStrike',
  type: 'TEXT',
  strokes: helloStrike,
  apiVersion: 'V4',
  exports: {
    'text/plain': ['hello', '']
  }
}

const helloOne = require('./strokes/helloOneStroke.json')
module.exports.helloOneStroke = {
  type: 'TEXT',
  strokes: helloOne,
  exports: {
    'text/plain': ['hello'],
    'application/vnd.myscript.jiix': {
      type: 'Text',
      label: 'hello',
      words: [
        {
          label: 'hello',
          candidates: ['hello', 'helto', 'helts', 'kelto', 'felto'],
        },
      ],
      version: '3',
      id: 'MainBlock',
    },
  },
}

const helloHowAreYouStrokes = require('./strokes/helloHowAreYou.json')
module.exports.helloHowAreYou = {
  type: 'TEXT',
  strokes: helloHowAreYouStrokes,
  exports: {
    'text/plain': [
      'hello',
      'hello how',
      'hello how o',
      'hello how are',
      'hello how are you',
      'hello how are you?',
      'hello how are you?',
    ],
  },
}

const oneStrokes = require('./strokes/one.json')
module.exports.one = {
  type: 'MATH',
  strokes: oneStrokes,
  exports: {
    LATEX: ['1'],
  },
}

const equation1Stroke = require('./strokes/equation1.json')
module.exports.equation1 = {
  type: 'MATH',
  strokes: equation1Stroke,
  exports: {
    LATEX: ['y', 'y-', 'y=', 'y=3', 'y=30', 'y=3x', 'y=3x-', 'y=3x+', 'y=3x+2'],
  },
}

const fenceStroke = require('./strokes/fence.json')
module.exports.fence = {
  type: 'MATH',
  strokes: fenceStroke,
  exports: {
    MATHML: {
      STANDARD: [
        "<math xmlns='http://www.w3.org/1998/Math/MathML'>\n" +
          '    <mrow>\n' +
          '        <mo> { </mo>\n' +
          "        <mtable columnalign='left'>\n" +
          '            <mtr>\n' +
          '                <mtd>\n' +
          '                    <msqrt>\n' +
          '                        <mn> 3 </mn>\n' +
          '                    </msqrt>\n' +
          '                </mtd>\n' +
          '            </mtr>\n' +
          '            <mtr>\n' +
          '                <mtd>\n' +
          '                    <msqrt>\n' +
          '                        <mn> 6 </mn>\n' +
          '                    </msqrt>\n' +
          '                </mtd>\n' +
          '            </mtr>\n' +
          '        </mtable>\n' +
          '    </mrow>\n' +
          '</math>',
      ],
      MSOFFICE: [
        "<math xmlns='http://www.w3.org/1998/Math/MathML'>\n" +
          '    <mfenced open="{" close="">\n' +
          "        <mtable columnalign='left'>\n" +
          '            <mtr>\n' +
          '                <mtd>\n' +
          '                    <msqrt>\n' +
          '                        <mn> 3 </mn>\n' +
          '                    </msqrt>\n' +
          '                </mtd>\n' +
          '            </mtr>\n' +
          '            <mtr>\n' +
          '                <mtd>\n' +
          '                    <msqrt>\n' +
          '                        <mn> 6 </mn>\n' +
          '                    </msqrt>\n' +
          '                </mtd>\n' +
          '            </mtr>\n' +
          '        </mtable>\n' +
          '    </mfenced>\n' +
          '</math>',
      ],
    },
  },
}
