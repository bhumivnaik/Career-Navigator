import { useState } from 'react'

function TargetCareer() {
  const [selectedCareer, setSelectedCareer] = useState('')

  const careers = [
    'Frontend Developer',
    'Backend Developer',
    'Full Stack Developer',
    'Data Analyst',
    'UI/UX Designer',
  ]

  const handleSave = () => {
    if (selectedCareer === '') {
      alert('Please select a target career.')
      return
    }

    alert(`Target career selected: ${selectedCareer}`)
  }

  return (
    <div>
      <h1>Select Your Target Career</h1>

      <p>
        Choose the career role you want to work towards.
      </p>

      <label>Target Career</label>

      <br />

      <select
        value={selectedCareer}
        onChange={(e) => setSelectedCareer(e.target.value)}
      >
        <option value="">-- Select a career --</option>

        {careers.map((career) => (
          <option key={career} value={career}>
            {career}
          </option>
        ))}
      </select>

      <br />
      <br />

      <button type="button" onClick={handleSave}>
        Save Target Career
      </button>

      {selectedCareer && (
        <div>
          <h2>Selected Career</h2>
          <p>{selectedCareer}</p>
        </div>
      )}
    </div>
  )
}

export default TargetCareer