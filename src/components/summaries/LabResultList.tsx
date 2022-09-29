import '../../Home.css'
import React from 'react'
import { useState, useEffect } from 'react'
import { Link } from "react-router-dom"
import { FHIRData, displayDate } from '../../data-services/models/fhirResources'
import { PatientSummary, ScreeningSummary, ObservationSummary } from '../../data-services/models/cqlSummary'
import { getLabResultSummary } from '../../data-services/mccCqlService'
import { Summary, SummaryRowItems } from './Summary'
import { BusySpinner } from '../busy-spinner/BusySpinner'

interface LabResultListProps {
  fhirData?: FHIRData,
  patientSummary?: PatientSummary,
  screenings?: [ScreeningSummary]
}

interface LabResultListState {
  labResultSummary?: ObservationSummary[]
}

export const LabResultList: React.FC<LabResultListProps> = (props: LabResultListProps) => {

  const [labResultSummary, setLabResultSummary] = useState<ObservationSummary[] | undefined>([
    { ConceptName: 'init', DisplayName: 'init', ResultText: 'init' }
  ])

  useEffect(() => {
    console.time('getLabResultSummary()')
    setLabResultSummary(getLabResultSummary(props.fhirData))
    console.timeEnd('getLabResultSummary()')
  }, [props.fhirData])

  return (
    <div className="home-view">
      <div className="welcome">

        <h4 className="title">Lab Results</h4>

        {props.fhirData === undefined
          && <> <p>Reading your clinical records...</p>
            <BusySpinner busy={props.fhirData === undefined} />
          </>
        }

        {labResultSummary && labResultSummary.length > 0 && labResultSummary[0]?.ConceptName === 'init'
          ? <p>Loading...</p>
          : (!labResultSummary || labResultSummary.length < 1) && props.fhirData !== undefined
            ? <p>No records found.</p>
            :
            <>
              {labResultSummary?.map((obs, idx) => (
                <Summary key={idx} id={idx} rows={buildRows(obs)} />
              ))}
            </>
        }

      </div>
    </div>
  )

}

const buildRows = (obs: ObservationSummary): SummaryRowItems => {
  let rows: SummaryRowItems =
    [
      {
        isHeader: true,
        twoColumns: true,
        data1: obs.DisplayName,
        data2: obs.LearnMore === undefined || obs.LearnMore === null ? '' :
          <Link to="route" target="_blank"
            onClick={
              (event) => { event.preventDefault(); window.open(obs.LearnMore); }
            }><i>Learn&nbsp;More</i>
          </Link>,
      },
      {
        isHeader: false,
        twoColumns: true,
        data1: obs.ResultText,
        data2: displayDate(obs.Date),
      },
      {
        isHeader: false,
        twoColumns: true,
        data1: obs.ReferenceRange === null ? '' : 'Range: ' + obs.ReferenceRange,
        data2: obs.Interpretation,
      },
      /* May need to be implemented one day...
      {obs.Notes?.map((note, idx) => (
      <tr key={idx}><td colSpan={4}>Note: {note}</td></tr>
      ))} */
    ]

  const provenance: SummaryRowItems | undefined = obs.Provenance?.map((provenance) => (
    {
      isHeader: false,
      twoColumns: true,
      data1: 'Source: ' + provenance.Transmitter ?? '',
      data2: provenance.Author ?? '',
    }
  ))
  if (provenance?.length) {
    rows = rows.concat(provenance)
  }

  return rows
}