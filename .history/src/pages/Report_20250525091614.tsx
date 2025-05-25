return (
  <div style={{ minHeight: "100vh", background: "#f3f4f6", padding: 20 }}>
    <h1 style={{ textAlign: "center", fontSize: 24, fontWeight: "bold", marginBottom: 24 }}>
      <FaClipboard className="inline-block mr-2" size={24} />
      Training Report
    </h1>

    {/* Search bar */}
    <div
      style={{
        width: isMobile ? "100%" : 500,
        margin: "0 auto",
        position: "relative",
        marginBottom: 24
      }}
    >
      <FaSearch size={20} style={{ position: "absolute", top: 10, left: 12, color: "#aaa" }} />
      <input
        type="text"
        placeholder="Search exercise..."
        value={busca}
        onChange={e => setBusca(e.target.value)}
        style={{
          width: "100%",
          padding: "10px 14px 10px 36px",
          borderRadius: 9999,
          border: "1px solid #ccc",
          background: "#fff",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
        }}
      />
    </div>

    {/* Cards container */}
    <div style={{ width: isMobile ? "100%" : 500, margin: "0 auto" }}>
      {linhasFiltradas.map((l, idx) => (
        <div
          key={idx}
          style={{
            width: "100%",
            background: "#fff",
            padding: 16,
            borderRadius: 12,
            boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
            marginBottom: 20,
            border: "1px solid #e2e8f0"
          }}
        >
          {editandoIdx === idx ? (
            <>
              {/* EDIT MODE */}
              <label style={{ display: "flex", alignItems: "center", fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
                <FaCalendarAlt className="mr-2" />Date
              </label>
              <input
                value={linhaEditada.data || l.data}
                onChange={e => setLinhaEditada(p => ({ ...p, data: e.target.value }))}
                placeholder="DD/MM/YYYY"
                style={{ width: "100%", marginBottom: 12, padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
              />

              {l.series.map((s, i) => (
                <div key={i} style={{ marginBottom: 12 }}>
                  <label style={{ display: "flex", alignItems: "center", fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
                    <FaStar className="mr-2" />Set {i + 1}
                  </label>
                  <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 8 }}>
                    {/* Repetitions */}
                    <div style={{ flex: 1 }}>
                      <label style={{ display: "flex", alignItems: "center", fontSize: 12, color: "#555", marginBottom: 2 }}>
                        <FaSyncAlt className="mr-1" />Repetitions
                      </label>
                      <input
                        value={linhaEditada.series?.[i]?.rep || s.rep}
                        onChange={e => {
                          const arr = [...(linhaEditada.series || l.series)];
                          arr[i] = { ...arr[i], rep: e.target.value };
                          setLinhaEditada(p => ({ ...p, series: arr }));
                        }}
                        placeholder="e.g., 8 reps"
                        style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
                      />
                    </div>
                    {/* Weight */}
                    <div style={{ flex: 1 }}>
                      <label style={{ display: "flex", alignItems: "center", fontSize: 12, color: "#555", marginBottom: 2 }}>
                        <FaDumbbell className="mr-1" />Weight
                      </label>
                      <input
                        value={linhaEditada.series?.[i]?.peso || s.peso}
                        onChange={e => {
                          const arr = [...(linhaEditada.series || l.series)];
                          arr[i] = { ...arr[i], peso: e.target.value };
                          setLinhaEditada(p => ({ ...p, series: arr }));
                        }}
                        placeholder="e.g., 100 kg"
                        style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
                      />
                    </div>
                  </div>
                </div>
              ))}

              <label style={{ display: "flex", alignItems: "center", fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
                <FaFileAlt className="mr-2" />Notes
              </label>
              <input
                value={linhaEditada.obs || l.obs || ""}
                onChange={e => setLinhaEditada(p => ({ ...p, obs: e.target.value }))}
                placeholder="Enter notes"
                style={{ width: "100%", marginBottom: 12, padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
              />

              <button
                style={{ width: isMobile ? "100%" : "auto", marginBottom: isMobile ? 8 : 0 }}
                onClick={() => salvarEdicao(idx)}
              >
                <FaSave className="inline-block mr-1" size={16} />Save
              </button>
              <button
                style={{ width: isMobile ? "100%" : "auto" }}
                onClick={() => setEditandoIdx(null)}
              >
                <FaTimes className="inline-block mr-1" size={16} />Cancel
              </button>
            </>
          ) : (
            <>
              {/* DISPLAY MODE */}
              <p>
                <FaCalendarAlt className="inline-block mr-1" size={16} />
                <strong>Date:</strong> {l.data}
              </p>
              <p>
                <FaDumbbell className="inline-block mr-1" size={16} />
                <strong>Exercise:</strong> {l.exercicio}
              </p>
              <p>
                <FaTag className="inline-block mr-1" size={16} />
                <strong>Cycle:</strong> {l.ciclo}
              </p>
              <p style={{ fontSize: 13, color: "#888" }}>
                <FaStar className="inline-block mr-1" size={14} />Set{" "}
                <FaSyncAlt className="inline-block mx-1" size={14} />
                Reps · <FaDumbbell className="inline-block mx-1" size={14} />
                Weight
              </p>
              {l.series.map(s => (
                <p
                  key={s.serie}
                  style={{
                    background: "#f9fafb",
                    border: "1px solid #e5e7eb",
                    padding: "8px 12px",
                    borderRadius: 6,
                    marginBottom: 6,
                    fontSize: 14,
                    color: "#333"
                  }}
                >
                  Set {s.serie}: {s.rep} reps x {s.peso} kg
                </p>
              ))}
              {l.obs && (
                <p
                  style={{
                    fontSize: 13,
                    color: "#555",
                    borderTop: "1px solid #eee",
                    marginTop: 12,
                    paddingTop: 10
                  }}
                >
                  <FaFileAlt className="inline-block mr-1" size={14} />{" "}
                  <strong>Notes:</strong> {l.obs}
                </p>
              )}
              <div
                style={{
                  display: "flex",
                  flexDirection: isMobile ? "column" : "row",
                  justifyContent: "space-between",
                  gap: 10,
                  marginTop: 10
                }}
              >
                <button
                  style={{ width: isMobile ? "100%" : "auto", marginBottom: isMobile ? 8 : 0 }}
                  onClick={() => {
                    setEditandoIdx(idx);
                    setLinhaEditada(iniciarEdicao(l));
                  }}
                >
                  <FaPencilAlt className="inline-block mr-1" size={16} />Edit
                </button>
                <button
                  style={{
                    width: isMobile ? "100%" : "auto",
                    backgroundColor: "#e11d48"
                  }}
                  onClick={() => excluirLinha(idx)}
                >
                  <FaTrashAlt className="inline-block mr-1" size={16} />Delete
                </button>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  </div>
);
