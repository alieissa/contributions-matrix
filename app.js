// Size of cell representing day (12) and padding around around it (2)
const cellSize = 14
// Query to get the last 53 weeks of contributions
const contributionQuery = `{
  user(login: "alieissa") {
    contributionsCollection {
      contributionCalendar {
        weeks {
          contributionDays {
            color
            contributionCount
            date
            weekday
          }
        }
      }
    }
  }
}`

function getContributions() {
  return fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `bearer ${token}`, // API token defined in config.js
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: contributionQuery }),
  })
    .then((response) => response.json())
    .then(
      (body) =>
        body.data.user.contributionsCollection.contributionCalendar.weeks
    )
}

getContributions()
  .then((data) => {
    // Each week is drawn as a column
    const weeks = d3
      .select('svg')
      .selectAll('g')
      .data(data)
      .enter()
      .append('g')
      .attr('transform', (_, i) => `translate(${cellSize * i}, 0)`)

    // Draw each day in week for all weeks
    weeks.each((d, i, nodes) => {
      d3.select(nodes[i])
        .selectAll('rect')
        .data(d.contributionDays)
        .enter()
        .append('rect')
        .attr('x', 0)
        .attr('y', (d) => cellSize * d.weekday)
        .attr('fill', (d) => d.color)
    })
  })
  .catch((err) => console.log('Unable to get contributions', err))
