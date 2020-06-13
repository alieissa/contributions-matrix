// TODO: Format date
// TODO: Fix Tooltip styles, i.e. background, font color and padding
// TODO: Add days and months axes
// TODO: Fix table styles
// TODO: Add contributions legend

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

const getContributions = () =>
  fetch('https://api.github.com/graphql', {
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

// Return information to be shown in tooltip
function getTooltipContent(datum) {
  if (datum.contributionCount === 0) {
    return `No contributions on ${datum.date}`
  } else if (datum.contributionCount === 1) {
    return `1 contribution on ${datum.date}`
  } else {
    return `${datum.contributionCount} contributions on ${datum.date}`
  }
}

// Gets the position of the tooltip so that tooltip is horizontally centered to
// anchor rectangle
const getTooltipLeftPosition = (d3Node) => {
  const tooltipWidth = 210
  const { x } = d3.select(d3Node).node().getBoundingClientRect()
  return x - tooltipWidth / 2 + 'px'
}

// Gets the position of the tooltip so that tooltip is horizontally centered to
// its anchor rectangle
const getTooltipTopPosition = (d3Node) => {
  const tooltipHeight = 28
  const tooltipArrowHeight = 5
  const { y } = d3.select(d3Node).node().getBoundingClientRect()
  return y - 28 - 5 + 'px'
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
    weeks.each((week, i, weekNodes) => {
      d3.select(weekNodes[i])
        .selectAll('rect')
        .data(week.contributionDays)
        .enter()
        .append('rect')
        .attr('x', 0)
        .attr('y', (d) => cellSize * d.weekday)
        .attr('fill', (d) => d.color)
        .on('mouseover', (d, j, dayNodes) => {
          /**
           * Cannot chain all methods together like
           *    tooltip
           *      .transitions
           *      .duration(200)
           *      .style('opacity', 0.8)
           *      .style('left', :left)
           * Error transition not a function error thrown
           */
          tooltip.transition().duration(200).style('opacity', 0.8)
          tooltip
            .style('left', getTooltipLeftPosition(dayNodes[j]))
            .style('top', getTooltipTopPosition(dayNodes[j]))
            .selectAll('.info-container')
            .html(getTooltipContent(d))
        })
        .on('mouseout', (d) => {
          tooltip.transition().duration(200).style('opacity', 0)
        })
    })
  })
  .catch((err) => console.log('Unable to get contributions', err))
