export function WSMessagesTab(props: string[])
{
  if (!props?.length) {
    return <div>
      List empty
    </div>
  }
  const messageList = props.map((m, i) => <li key={`list-item-${ i }`}>{m}</li>)
  return (
    <ol
      style={{
        paddingBottom: '25px',
      }}
    >
      {messageList}
    </ol>
  )
}
