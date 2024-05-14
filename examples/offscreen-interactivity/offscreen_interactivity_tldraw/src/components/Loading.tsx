export function Loading(props: { loading: boolean })
{
  if (props.loading) {
    return (
      <div
        style={{
          backgroundColor: "white",
          opacity: 0.75,
          zIndex: 999,
          position: "absolute",
          top: 0,
          left: 0,
          height: "inherit",
          width: "inherit",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <div className="loader"></div>
      </div>
    )
  }
}
