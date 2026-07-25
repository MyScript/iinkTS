import strokes from "./json/fence.json" with { type: "json" }

export default {
  strokes,
  exports: {
    MATHML: {
      STANDARD: [
        "<math xmlns='http://www.w3.org/1998/Math/MathML'>\n              <mrow>\n                  <mo> { </mo>\n                  <mtable columnalign='left'>\n                      <mtr>\n                          <mtd>\n                              <msqrt>\n                                  <mn> 3 </mn>\n                              </msqrt>\n                          </mtd>\n                      </mtr>\n                      <mtr>\n                          <mtd>\n                              <msqrt>\n                                  <mn> 6 </mn>\n                              </msqrt>\n                          </mtd>\n                      </mtr>\n                  </mtable>\n              </mrow>\n          </math>",
      ],
      MSOFFICE: [
        "<math xmlns='http://www.w3.org/1998/Math/MathML'>\n            <mfenced open=\"{\" close=\"\">\n                  <mtable columnalign='left'>\n                    <mtr>\n                        <mtd>\n                            <msqrt>\n                                <mn> 3 </mn>\n                            </msqrt>\n                        </mtd>\n                    </mtr>\n                    <mtr>\n                        <mtd>\n                            <msqrt>\n                                <mn> 6 </mn>\n                            </msqrt>\n                        </mtd>\n                    </mtr>\n                </mtable>\n            </mfenced>\n        </math>",
      ],
    },
  },
}
