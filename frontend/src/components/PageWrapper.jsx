export default function PageWrapper({ children }) {
  return (
    <div className="page-enter" style={{ width: '100%', position: 'relative', zIndex: 1 }}>
      {children}
    </div>
  )
}
