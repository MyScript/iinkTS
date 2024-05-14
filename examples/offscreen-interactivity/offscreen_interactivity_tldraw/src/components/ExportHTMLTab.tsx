export function ExportHTMLTab(props: string)
{
  return (<iframe
    style={{
      height: 'calc(100% - 3px)',
      width: '100%',
      border: 'none'
    }}
    srcDoc={props}
  ></iframe>
  )
}
