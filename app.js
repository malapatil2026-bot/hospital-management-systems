// ============================================================
//  app.js - All application logic
// ============================================================

let patients = [];
let doctors = [];
let editingPatientId = null;
let editingDoctorId = null;

// DOM helper
const $ = id => document.getElementById(id);

// Message display with auto-clear
function msg(id, text, type = "success") {
  const e = $(id);
  e.textContent = text;
  e.className = type;
  setTimeout(() => {
    e.textContent = "";
    e.className = "";
  }, 3500);
}

// Escape HTML to prevent XSS
function esc(v) {
  return String(v ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

// ============================================================
//  DOCTOR FUNCTIONS
// ============================================================

async function loadDoctors() {
  const { data, error } = await supabaseClient
    .from("doctors")
    .select("idno, name, specialisation")
    .order("idno");

  if (error) {
    $("doctorTableBody").innerHTML = `<tr><td colspan="4" class="error">⚠️ ${esc(error.message)}</td></tr>`;
    return;
  }
  doctors = data || [];
  renderDoctors(doctors);
  populateDoctorSelect();
}

function renderDoctors(data) {
  $("doctorTableBody").innerHTML = data.length
    ? data.map(d => `<tr>
        <td>${esc(d.idno)}</td>
        <td>${esc(d.name)}</td>
        <td>${esc(d.specialisation)}</td>
        <td>
          <button class="edit" onclick="editDoctor(${Number(d.idno)})">✎ Edit</button>
          <button class="delete" onclick="deleteDoctor(${Number(d.idno)})">🗑 Delete</button>
        </td>
      </tr>`).join("")
    : '<tr><td colspan="4" class="empty">🌸 no doctors yet</td></tr>';
}

function populateDoctorSelect() {
  $("doctor_id").innerHTML = '<option value="">Select Doctor</option>' +
    doctors.map(d => `<option value="${esc(d.idno)}">${esc(d.idno)} - ${esc(d.name)} (${esc(d.specialisation)})</option>`).join("");
}

// Doctor Form Submit
$("doctorForm").addEventListener("submit", async e => {
  e.preventDefault();
  const idno = Number($("doctorId").value);
  const name = $("doctorName").value.trim();
  const specialisation = $("specialisation").value.trim();

  if (!Number.isInteger(idno) || idno <= 0 || !name || !specialisation) {
    msg("doctorMessage", "Please enter valid doctor details.", "error");
    return;
  }

  $("doctorSaveBtn").disabled = true;
  try {
    const result = editingDoctorId === null
      ? await supabaseClient.from("doctors").insert([{ idno, name, specialisation }])
      : await supabaseClient.from("doctors").update({ name, specialisation }).eq("idno", editingDoctorId);

    if (result.error) throw result.error;
    msg("doctorMessage", editingDoctorId === null ? "✅ Doctor added." : "✅ Doctor updated.");
    clearDoctorForm();
    await loadDoctors();
    await loadPatients();
  } catch (err) {
    msg("doctorMessage", err.code === "23505" ? "⚠️ Doctor ID already exists." : err.message, "error");
  } finally {
    $("doctorSaveBtn").disabled = false;
  }
});

// Edit Doctor
window.editDoctor = id => {
  const d = doctors.find(x => Number(x.idno) === Number(id));
  if (!d) return;
  editingDoctorId = d.idno;
  $("doctorId").value = d.idno;
  $("doctorName").value = d.name;
  $("specialisation").value = d.specialisation;
  $("doctorId").disabled = true;
  $("doctorSaveBtn").textContent = "✏️ Update Doctor";
  window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
};

// Delete Doctor
window.deleteDoctor = async id => {
  const d = doctors.find(x => Number(x.idno) === Number(id));
  if (!d) return;

  const used = patients.some(p => Number(p.doctor_id) === Number(id));
  if (used) {
    msg("doctorMessage", "⚠️ Doctor linked to patients. Reassign first.", "error");
    return;
  }

  if (!confirm(`Delete doctor ${d.name} (ID: ${d.idno})?`)) return;
  const { error } = await supabaseClient.from("doctors").delete().eq("idno", id);
  if (error) {
    msg("doctorMessage", error.message, "error");
    return;
  }
  msg("doctorMessage", "🗑 Doctor deleted.");
  await loadDoctors();
};

// Clear Doctor Form
window.clearDoctorForm = () => {
  $("doctorForm").reset();
  editingDoctorId = null;
  $("doctorId").disabled = false;
  $("doctorSaveBtn").textContent = "➕ Add Doctor";
};

// ============================================================
//  PATIENT FUNCTIONS
// ============================================================

async function loadPatients() {
  const { data, error } = await supabaseClient
    .from("patients")
    .select("idno, name, age, disease, doctor_id, doctors(idno, name, specialisation)")
    .order("idno");

  if (error) {
    $("patientTableBody").innerHTML = `<tr><td colspan="6" class="error">⚠️ ${esc(error.message)}</td></tr>`;
    return;
  }
  patients = data || [];
  renderPatients(patients);
}

function renderPatients(data) {
  $("patientTableBody").innerHTML = data.length
    ? data.map(p => `<tr>
        <td>${esc(p.idno)}</td>
        <td>${esc(p.name)}</td>
        <td>${esc(p.age)}</td>
        <td>${esc(p.disease)}</td>
        <td>${p.doctors ? esc(p.doctors.name) : '—'}</td>
        <td>
          <button class="edit" onclick="editPatient(${Number(p.idno)})">✎ Edit</button>
          <button class="delete" onclick="deletePatient(${Number(p.idno)})">🗑 Delete</button>
        </td>
      </tr>`).join("")
    : '<tr><td colspan="6" class="empty">🌸 no patients yet</td></tr>';
}

// Patient Form Submit
$("patientForm").addEventListener("submit", async e => {
  e.preventDefault();
  const idno = Number($("idno").value);
  const name = $("name").value.trim();
  const age = Number($("age").value);
  const disease = $("disease").value.trim();
  const doctor_id = Number($("doctor_id").value);

  if (!Number.isInteger(idno) || idno <= 0 || !name || !disease || !Number.isInteger(age) || age < 0 || age > 150 || !Number.isInteger(doctor_id)) {
    msg("patientMessage", "Please fill all fields correctly.", "error");
    return;
  }

  $("patientSaveBtn").disabled = true;
  try {
    const payload = { name, age, disease, doctor_id };
    const result = editingPatientId === null
      ? await supabaseClient.from("patients").insert([{ idno, ...payload }])
      : await supabaseClient.from("patients").update(payload).eq("idno", editingPatientId);

    if (result.error) throw result.error;
    msg("patientMessage", editingPatientId === null ? "✅ Patient added." : "✅ Patient updated.");
    clearPatientForm();
    await loadPatients();
  } catch (err) {
    msg("patientMessage", err.code === "23505" ? "⚠️ Patient ID already exists." : err.message, "error");
  } finally {
    $("patientSaveBtn").disabled = false;
  }
});

// Edit Patient
window.editPatient = id => {
  const p = patients.find(x => Number(x.idno) === Number(id));
  if (!p) return;
  editingPatientId = p.idno;
  $("idno").value = p.idno;
  $("name").value = p.name;
  $("age").value = p.age;
  $("disease").value = p.disease;
  $("doctor_id").value = p.doctor_id;
  $("idno").disabled = true;
  $("patientSaveBtn").textContent = "✏️ Update Patient";
  window.scrollTo({ top: 0, behavior: "smooth" });
};

// Delete Patient
window.deletePatient = async id => {
  const p = patients.find(x => Number(x.idno) === Number(id));
  if (!p) return;
  if (!confirm(`Delete patient ${p.name} (ID: ${p.idno})?`)) return;
  const { error } = await supabaseClient.from("patients").delete().eq("idno", id);
  if (error) {
    msg("patientMessage", error.message, "error");
    return;
  }
  msg("patientMessage", "🗑 Patient deleted.");
  await loadPatients();
};

// Clear Patient Form
window.clearPatientForm = () => {
  $("patientForm").reset();
  editingPatientId = null;
  $("idno").disabled = false;
  $("patientSaveBtn").textContent = "➕ Add Patient";
};

// ============================================================
//  SEARCH FUNCTIONALITY
// ============================================================

$("patientSearch").addEventListener("input", e => {
  const t = e.target.value.toLowerCase().trim();
  renderPatients(!t
    ? patients
    : patients.filter(p =>
        [p.idno, p.name, p.age, p.disease, p.doctors?.name, p.doctors?.specialisation]
          .some(v => String(v ?? "").toLowerCase().includes(t))
      )
  );
});

$("doctorSearch").addEventListener("input", e => {
  const t = e.target.value.toLowerCase().trim();
  renderDoctors(!t
    ? doctors
    : doctors.filter(d =>
        [d.idno, d.name, d.specialisation]
          .some(v => String(v ?? "").toLowerCase().includes(t))
      )
  );
});

// ============================================================
//  INITIALIZATION
// ============================================================

(async () => {
  await loadDoctors();
  await loadPatients();
})();

console.log("🌸 Pink Hospital System ready.");
