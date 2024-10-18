export const dummyClient = {
  name: "Dummy",
  email: "dummy@gmail.com",
  conditionId: "hip-osteoarthritis",
  date: "2024-06-05T11:51:20.166Z",
  prescription: {
    prescriptionDate: "2024-06-05T11:53:36.366Z",
    status: "Started",

    programVersionIdentifiers: {
      clinicians: "G0NIKSUSoXZEbrchsXFLIqm816q2",
      programs: "a4tBOw6aljL6CXGSj540",
      versions: "1.bVGQLQR0w5gaRfPt66E6",
    },
    // clientProgramIdentifiers: {
    //   clients: "thGy0DybaOhCpbcsYNnUYinwah72",
    //   programs: "6t0ewVqGMX3fwvj3HcwB",
    // },
  },
  clientProgram: {
    outcomeMeasuresAnswers: {
      hoos: [
        {
          date: "2024-06-05T00:00:00.000Z",
          sections: [
            {
              answers: [1, 2, 2, 2, 1],
              score: 60,
              sectionName: "Symptoms",
            },
            {
              score: 75,
              answers: [0, 1, 1, 1, 2, 1, 0, 1, 2, 1],
              sectionName: "Pain",
            },
            {
              score: 75,
              answers: [1, 1, 1, 1, 2, 0, 1, 1, 2, 1, 1, 1, 1, 0, 0, 2, 1],
              sectionName: "Activities",
            },
            {
              answers: [1, 0, 2, 1],
              sectionName: "Sports and recreation",
              score: 75,
            },
            {
              score: 37,
              answers: [2, 3, 2, 3],
              sectionName: "Quality of life",
            },
          ],
          outcomeMeasureId: "hoos",
        },
        {
          outcomeMeasureId: "hoos",
          date: "2024-07-07T00:00:00.000Z",
          sections: [
            {
              answers: [0, 1, 1, 1, 1],
              sectionName: "Symptoms",
              score: 80,
            },
            {
              score: 75,
              sectionName: "Pain",
              answers: [2, 0, 1, 1, 1, 1, 1, 0, 1, 2],
            },
            {
              answers: [1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 2, 1],
              sectionName: "Activities",
              score: 78,
            },
            {
              score: 62,
              sectionName: "Sports and recreation",
              answers: [1, 2, 2, 1],
            },
            {
              answers: [3, 3, 2, 2],
              sectionName: "Quality of life",
              score: 37,
            },
          ],
        },
        {
          date: "2024-08-06T00:00:00.000Z",
          sections: [
            {
              sectionName: "Symptoms",
              answers: [1, 2, 2, 2, 2],
              score: 55,
            },
            {
              sectionName: "Pain",
              answers: [2, 2, 2, 2, 2, 1, 1, 1, 2, 2],
              score: 57,
            },
            {
              answers: [1, 2, 2, 1, 2, 1, 2, 2, 2, 1, 2, 1, 1, 1, 1, 3, 2],
              score: 60,
              sectionName: "Activities",
            },
            {
              sectionName: "Sports and recreation",
              score: 62,
              answers: [1, 2, 2, 1],
            },
            {
              score: 37,
              sectionName: "Quality of life",
              answers: [3, 3, 2, 2],
            },
          ],
          outcomeMeasureId: "hoos",
        },
        {
          date: "2024-09-09T00:00:00.000Z",
          outcomeMeasureId: "hoos",
          sections: [
            {
              answers: [1, 2, 2, 1, 2],
              score: 60,
              sectionName: "Symptoms",
            },
            {
              sectionName: "Pain",
              answers: [2, 0, 2, 1, 1, 1, 1, 1, 1, 2],
              score: 70,
            },
            {
              score: 63,
              sectionName: "Activities",
              answers: [1, 2, 1, 1, 3, 1, 2, 2, 2, 1, 1, 1, 1, 1, 1, 3, 1],
            },
            {
              answers: [1, 3, 2, 2],
              score: 50,
              sectionName: "Sports and recreation",
            },
            {
              answers: [3, 3, 2, 1],
              sectionName: "Quality of life",
              score: 44,
            },
          ],
        },
        {
          sections: [
            {
              answers: [0, 1, 1, 2, 2],
              score: 70,
              sectionName: "Symptoms",
            },
            {
              score: 60,
              answers: [2, 1, 2, 1, 2, 2, 2, 1, 1, 2],
              sectionName: "Pain",
            },
            {
              sectionName: "Activities",
              answers: [1, 2, 1, 1, 2, 1, 2, 1, 3, 1, 1, 1, 1, 1, 1, 3, 1],
              score: 65,
            },
            {
              score: 50,
              answers: [1, 3, 2, 2],
              sectionName: "Sports and recreation",
            },
            {
              sectionName: "Quality of life",
              answers: [3, 3, 2, 2],
              score: 37,
            },
          ],
          date: "2024-10-07T00:00:00.000Z",
          outcomeMeasureId: "hoos",
        },
      ],
    },
    trainingDays: [true, true, false, true, true, false, true],
    phases: [
      {
        key: "p1",
        value: 140,
      },
    ],
    physicalInformation: {
      height: 172,
      unit: "metric",
      weight: 80,
      physicalActivity: "moderate",
      athlete: false,
    },
    conditionId: "hip-osteoarthritis",
    painLevels: [
      {
        painIndex: 3,
        date: "2024-06-05T00:00:00.000Z",
      },
      {
        date: "2024-06-07T15:57:41.131Z",
        painIndex: 3,
      },
      {
        painIndex: 3,
        date: "2024-06-09T12:02:27.284Z",
      },
      {
        date: "2024-06-10T12:42:43.376Z",
        painIndex: 2,
      },
      {
        painIndex: 3,
        date: "2024-06-11T13:54:37.965Z",
      },
      {
        date: "2024-06-12T13:42:31.434Z",
        painIndex: 3,
      },
      {
        date: "2024-06-13T16:51:17.640Z",
        painIndex: 3,
      },
      {
        painIndex: 3,
        date: "2024-06-14T12:09:13.428Z",
      },
      {
        date: "2024-06-17T15:11:49.078Z",
        painIndex: 2,
      },
      {
        painIndex: 2,
        date: "2024-06-18T13:48:04.557Z",
      },
      {
        painIndex: 2,
        date: "2024-06-20T15:02:03.463Z",
      },
      {
        date: "2024-06-21T17:36:24.066Z",
        painIndex: 2,
      },
      {
        painIndex: 2,
        date: "2024-06-24T21:34:12.267Z",
      },
      {
        painIndex: 2,
        date: "2024-06-25T12:02:59.717Z",
      },
      {
        painIndex: 2,
        date: "2024-06-27T13:40:45.421Z",
      },
      {
        date: "2024-06-28T16:08:49.886Z",
        painIndex: 2,
      },
      {
        date: "2024-06-30T18:10:58.671Z",
        painIndex: 2,
      },
      {
        painIndex: 2,
        date: "2024-07-01T12:29:33.576Z",
      },
      {
        date: "2024-07-02T14:42:12.380Z",
        painIndex: 2,
      },
      {
        date: "2024-07-07T15:37:04.098Z",
        painIndex: 2,
      },
      {
        date: "2024-07-08T15:58:11.705Z",
        painIndex: 2,
      },
      {
        painIndex: 2,
        date: "2024-07-11T12:15:02.512Z",
      },
      {
        painIndex: 2,
        date: "2024-07-12T19:40:56.169Z",
      },
      {
        date: "2024-07-14T18:18:47.080Z",
        painIndex: 1,
      },
      {
        painIndex: 1,
        date: "2024-07-15T18:01:31.676Z",
      },
      {
        painIndex: 1,
        date: "2024-07-22T19:14:48.974Z",
      },
      {
        painIndex: 2,
        date: "2024-07-23T21:17:39.808Z",
      },
      {
        date: "2024-07-25T19:59:57.956Z",
        painIndex: 1,
      },
      {
        date: "2024-07-26T20:18:05.727Z",
        painIndex: 2,
      },
      {
        painIndex: 2,
        date: "2024-07-28T18:16:28.450Z",
      },
      {
        painIndex: 2,
        date: "2024-07-29T18:23:09.420Z",
      },
      {
        painIndex: 2,
        date: "2024-08-01T17:15:47.867Z",
      },
      {
        painIndex: 2,
        date: "2024-08-02T17:38:05.020Z",
      },
      {
        painIndex: 2,
        date: "2024-08-03T17:24:37.367Z",
      },
      {
        date: "2024-08-06T16:05:31.162Z",
        painIndex: 2,
      },
      {
        date: "2024-08-08T19:12:41.257Z",
        painIndex: 1,
      },
      {
        painIndex: 1,
        date: "2024-08-09T13:46:28.422Z",
      },
      {
        date: "2024-08-11T21:37:59.454Z",
        painIndex: 2,
      },
      {
        painIndex: 2,
        date: "2024-08-12T15:20:36.533Z",
      },
      {
        date: "2024-08-15T20:58:20.192Z",
        painIndex: 2,
      },
      {
        painIndex: 1,
        date: "2024-08-16T07:57:40.075Z",
      },
      {
        painIndex: 2,
        date: "2024-08-19T08:23:58.111Z",
      },
      {
        date: "2024-08-20T08:43:52.057Z",
        painIndex: 2,
      },
      {
        painIndex: 3,
        date: "2024-08-25T12:00:31.642Z",
      },
      {
        painIndex: 3,
        date: "2024-08-27T13:55:40.321Z",
      },
      {
        date: "2024-08-29T15:46:31.950Z",
        painIndex: 4,
      },
      {
        painIndex: 3,
        date: "2024-08-30T14:08:24.049Z",
      },
      {
        date: "2024-09-01T19:55:27.280Z",
        painIndex: 3,
      },
      {
        date: "2024-09-02T15:36:29.942Z",
        painIndex: 4,
      },
      {
        painIndex: 2,
        date: "2024-09-09T13:15:57.895Z",
      },
      {
        date: "2024-09-10T13:31:41.289Z",
        painIndex: 3,
      },
      {
        date: "2024-09-11T12:29:45.267Z",
        painIndex: 2,
      },
      {
        date: "2024-09-12T14:30:07.094Z",
        painIndex: 3,
      },
      {
        painIndex: 3,
        date: "2024-09-13T12:38:06.798Z",
      },
      {
        date: "2024-09-15T16:14:48.893Z",
        painIndex: 2,
      },
      {
        date: "2024-09-16T15:12:46.419Z",
        painIndex: 3,
      },
      {
        date: "2024-09-17T12:32:01.294Z",
        painIndex: 2,
      },
      {
        painIndex: 2,
        date: "2024-09-19T16:31:06.593Z",
      },
      {
        date: "2024-09-20T09:29:20.915Z",
        painIndex: 3,
      },
      {
        painIndex: 2,
        date: "2024-09-23T01:06:54.568Z",
      },
      {
        painIndex: 1,
        date: "2024-09-24T18:55:05.002Z",
      },
      {
        date: "2024-09-27T16:36:33.543Z",
        painIndex: 2,
      },
      {
        date: "2024-09-28T18:22:28.183Z",
        painIndex: 1,
      },
      {
        painIndex: 2,
        date: "2024-09-30T16:00:45.503Z",
      },
      {
        date: "2024-10-03T17:20:46.570Z",
        painIndex: 1,
      },
      {
        date: "2024-10-06T23:11:00.786Z",
        painIndex: 1,
      },
      {
        painIndex: 1,
        date: "2024-10-07T17:45:11.234Z",
      },
      {
        date: "2024-10-09T15:39:05.039Z",
        painIndex: 2,
      },
      {
        painIndex: 1,
        date: "2024-10-10T17:49:42.827Z",
      },
      {
        painIndex: 1,
        date: "2024-10-13T20:59:01.893Z",
      },
      {
        painIndex: 1,
        date: "2024-10-14T00:15:49.173Z",
      },
      {
        date: "2024-10-15T15:29:31.842Z",
        painIndex: 1,
      },
    ],

    programVersionIdentifiers: {
      clinicians: "qK223Buf65bERcgUl6IfwF8r6A83",
      programs: "a4tBOw6aljL6CXGSj540",
      versions: "1.bVGQLQR0w5gaRfPt66E6",
    },

    clinicianClientIdentifiers: {
      clinicians: "qK223Buf65bERcgUl6IfwF8r6A83",
      clients: "gm0FLfRvYM0maQu22EC1",
    },
    days: [
      {
        adherence: 0,
        date: "2024-06-05T00:00:00.000Z",
        phaseId: "p1",
        restDay: true,
        dayId: "d1",
        finished: false,
        exercises: [0, 0, 0, 0, 0],
      },
      {
        adherence: 0,
        date: "2024-06-06T00:00:00.000Z",
        phaseId: "p1",
        restDay: false,
        finished: false,
        exercises: [0, 0, 0, 0, 0],
        dayId: "d1",
      },
      {
        exercises: [2, 2, 2, 2, 2],
        adherence: 100,
        restDay: false,
        date: "2024-06-07T00:00:00.000Z",
        dayId: "d1",
        finished: false,
        phaseId: "p1",
      },
      {
        restDay: true,
        exercises: [0, 0, 0, 0, 0],
        phaseId: "p1",
        date: "2024-06-08T00:00:00.000Z",
        finished: false,
        adherence: 0,
        dayId: "d1",
      },
      {
        restDay: false,
        exercises: [2, 2, 2, 2, 2],
        finished: false,
        phaseId: "p1",
        dayId: "d1",
        date: "2024-06-09T00:00:00.000Z",
        adherence: 100,
      },
      {
        adherence: 100,
        exercises: [2, 2, 2, 2, 2],
        date: "2024-06-10T00:00:00.000Z",
        finished: false,
        phaseId: "p1",
        dayId: "d1",
        restDay: false,
      },
      {
        phaseId: "p1",
        date: "2024-06-11T00:00:00.000Z",
        dayId: "d1",
        exercises: [2, 2, 2, 2, 2],
        restDay: false,
        finished: false,
        adherence: 100,
      },
    ],

    clientProgramIdentifiers: {
      clients: "thGy0DybaOhCpbcsYNnUYinwah72",
      programs: "6t0ewVqGMX3fwvj3HcwB",
    },
  },
};

function generateDays() {
  const daysArray = Array.from({ length: 90 }, (_, i) => 90 - i);
  return daysArray.map((i) => {
    const date = new Date(new Date().setDate(new Date().getDate() - i));
    date.setHours(0, 0, 0, 0);

    return {
      phaseId: "p1",
      date: date,
      dayId: "d1",
      exercises: [0, 0, 0, 0, 0],
      restDay: false,
      finished: false,
      adherence: 100,
    };
  });
}

function generatePainLevels() {
  const daysArray = Array.from({ length: 90 }, (_, i) => 90 - i);
  return daysArray.map((i) => {
    const date = new Date(new Date().setDate(new Date().getDate() - i));
    const painIndex = Math.round((i / daysArray.length) * 10);
    return {
      painIndex: painIndex,
      date: date,
    };
  });
}

function generateOutcomeMeasuresAnswers() {
  const hoosTemplateSections = {
    sections: [
      {
        answers: [1, 2, 2, 2, 1],
        score: 60,
        sectionName: "Symptoms",
      },
      {
        score: 75,
        answers: [0, 1, 1, 1, 2, 1, 0, 1, 2, 1],
        sectionName: "Pain",
      },
      {
        score: 75,
        answers: [1, 1, 1, 1, 2, 0, 1, 1, 2, 1, 1, 1, 1, 0, 0, 2, 1],
        sectionName: "Activities",
      },
      {
        answers: [1, 0, 2, 1],
        sectionName: "Sports and recreation",
        score: 75,
      },
      {
        score: 37,
        answers: [2, 3, 2, 3],
        sectionName: "Quality of life",
      },
    ],
    outcomeMeasureId: "hoos",
  };

  const days = generateDays();
  return days
    .map((day, index) => {
      if (index % 29 === 0) {
        const sections = hoosTemplateSections.sections.map((s) => {
          let score = Math.round((index / days.length) * 100);
          // add a random number to the score from -20 to 20
          const randomNumber = Math.random() * 40 - 20;
          console.log(randomNumber);

          score += randomNumber;
          if (score < 0) {
            score = 0;
          }
          if (score > 100) {
            score = 100;
          }
          return {
            ...s,
            score: Math.round(score),
          };
        });
        const outcomeMeasure = {
          ...hoosTemplateSections,
          date: day.date,
          sections: sections,
        };
        return outcomeMeasure;
      }
      return null;
    })
    .filter(Boolean);
}

export function createDummyClinicianClient() {
  // create a array that starts 90 days in the past and to today:

  return {
    ...dummyClient,
    clientProgram: {
      ...dummyClient.clientProgram,
      days: generateDays(),
      painLevels: generatePainLevels(),
      outcomeMeasuresAnswers: { hoos: generateOutcomeMeasuresAnswers() },
    },
  };
}
