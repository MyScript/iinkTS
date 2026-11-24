
export function Modal(props: { title: string, message: string, type: "info" | "error", onClose: () => void })
{
  return (
    <div
      className={`modal ${ props.type }`}
    >
      <h3 className="modal-header">
        {props.title}
      </h3>
      <div className="modal-content">
        {props.message}
      </div>
      <div className="modal-footer">
        <button className="close-btn" onPointerUp={props.onClose}>
          Close
        </button>
      </div>
    </div>
  )
}
