export default function Page({ params }: { params: { id: string } }) {
  return <div style={{ padding: 24 }}>COURSE ID: {params.id}</div>;
}