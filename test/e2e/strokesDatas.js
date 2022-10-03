
const hStrokes = require('./strokes/h.json')
module.exports.h = {
  type: 'TEXT',
  strokes: hStrokes,
  exports: {
    TEXT: ['h']
  }
}

const helloStrokes = require('./strokes/hello.json')
module.exports.hello = {
  type: 'TEXT',
  strokes: helloStrokes,
  exports: {
    TEXT: ['h', 'he', 'hee', 'heel', 'hello']
  }
}

const helloHowAreYouStrokes = require('./strokes/helloHowAreYou.json')
module.exports.helloHowAreYou = {
  type: 'TEXT',
  strokes: helloHowAreYouStrokes,
  exports: {
    TEXT: ['hello', 'hello how', 'hello how o', 'hello how are', 'hello how are you', 'hello how are you?', 'hello how are you?']
  }
}

const oneStrokes = require('./strokes/one.json')
module.exports.one = {
  type: 'MATH',
  strokes: oneStrokes,
  exports: {
    LATEX: ['1']
  }
}

const equation1Stroke = require('./strokes/equation1.json')
module.exports.equation1 = {
  type: 'MATH',
  strokes: equation1Stroke,
  exports: {
    LATEX: ['y', 'y-', 'y=', 'y=3', 'y=30', 'y=3x', 'y=3x-', 'y=3x+', 'y=3x+2']
  }
}

const fenceStroke = require('./strokes/fence.json')
module.exports.fence = {
  type: 'MATH',
  strokes: fenceStroke,
  exports: {
    MATHML: {
      STANDARD: [
        '<math xmlns=\'http://www.w3.org/1998/Math/MathML\'>\n' +
        '    <mrow>\n' +
        '        <mo> { </mo>\n' +
        '        <mtable columnalign=\'left\'>\n' +
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
        '</math>'
      ],
      MSOFFICE: [
        '<math xmlns=\'http://www.w3.org/1998/Math/MathML\'>\n' +
        '    <mfenced open="{" close="">\n' +
        '        <mtable columnalign=\'left\'>\n' +
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
        '</math>'
      ]
    }
  }
}