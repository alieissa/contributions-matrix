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

function getTooltipContent(datum) {
  if (datum.contributionCount === 0) {
    return `No contributions on ${datum.date}`
  } else if (datum.contributionCount === 1) {
    return `1 contribution on ${datum.date}`
  } else {
    return `${datum.contributionCount} contributions on ${datum.date}`
  }
}

getContributions()
  .then((data) => {
    const tooltip = d3.select('.tooltip')

    // Each week is drawn as a column
    const weeks = d3
      .select('svg')
      .selectAll('g')
      .data(data)
      .enter()
      .append('g')
      .attr('transform', (_, i) => `translate(${cellSize * i}, 0)`)

    // Draw each day in week for all weeks
    weeks.each((week, i, nodes) => {
      d3.select(nodes[i])
        .selectAll('rect')
        .data(week.contributionDays)
        .enter()
        .append('rect')
        .attr('x', 0)
        .attr('y', (d) => cellSize * d.weekday)
        .attr('fill', (d) => d.color)
        .on('mouseover', (d) => {
          tooltip.transition().duration(200).style('opacity', 0.9)
          tooltip
            .style('left', d3.event.pageX - 97.5 + 'px')
            .style('top', d3.event.pageY - 34 + 'px')
            .selectAll('.content')
            .html(getTooltipContent(d))
        })
        .on('mouseout', (d) => {
          tooltip.transition().duration(500).style('opacity', 0)
        })
    })
  })
  .catch((err) => console.log('Unable to get contributions', err))
