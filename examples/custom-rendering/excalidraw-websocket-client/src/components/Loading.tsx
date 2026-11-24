export function Loading(props: { loading: boolean })
{
  if (props.loading) {
    return (
      <div className="loading-overlay">
        <div className="loader"></div>
      </div>
    )
  }
}
