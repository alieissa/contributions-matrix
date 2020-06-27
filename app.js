// TODO: Add days and months axes
// TODO: Fix table styles
// TODO: Add contributions legend

// Size of cell representing day (12) and padding around around it (2)
const cellSize = 12
const paddedCellSize = cellSize + 2
// Query to get the last 53 weeks of contributions
const contributionQuery = `{
  user(login: "alieissa") {
    contributionsCollection {
      contributionCalendar {
        months {
          name
        }
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
    .then((body) =>
      ['weeks', 'months'].map(
        (key) =>
          body.data.user.contributionsCollection.contributionCalendar[key]
      )
    )

// Return information to be shown in tooltip
function getTooltipMessageStartContent(datum) {
  if (datum.contributionCount === 0) {
    return `No contributions on`
  } else if (datum.contributionCount === 1) {
    return `1 contribution on`
  } else {
    return `${datum.contributionCount} contributions on `
  }
}

/**
 * Gets the left position of the tooltip so that tooltip is horizontally centered to
 * anchor rectangle. To center we move the left of the edge of the tooltip to the
 * center of the cell (x + cellSize /2) and then subtract half of the width of the
 * the tooltip (tooltipWidth / 2) which finally brings the center of the tooltip to
 * the center of the cell
 */
const getTooltipLeftPosition = (d3Node) => {
  const tooltipWidth = 190
  const { x } = d3.select(d3Node).node().getBoundingClientRect()
  return x + cellSize / 2 - tooltipWidth / 2 + 'px'
}

/**
 * Gets the top position of the tooltip so that the tootip is directly above the
 * anchor cell.
 */
const getTooltipTopPosition = (d3Node) => {
  const tooltipHeight = 24
  const tooltipArrowHeight = 5
  const { y } = d3.select(d3Node).node().getBoundingClientRect()
  return y - tooltipHeight - tooltipArrowHeight - cellSize + 'px'
}

/**
 * Returns the transformation that positions the cell exactly in the
 * matrix. paddedCellSize * weekIndex gives us its x axis position,
 * we add 40 to account for offset needed for the axis, while the y position of
 * 20 is to account for the y axis
 */
const getCellTransformation = (_, weekIndex) =>
  `translate(${paddedCellSize * weekIndex + 40}, 20)`

getContributions()
  .then(([weeklyContributionData, months]) => {
    /**
     * Tooltip contains two elements, the tooltip message container and date container.
     * The message container contains the beginning of the tooltip message, e.g.
     *  "3 contributions on ", while the date-container contais the date, e.g.
     *  Aug 3, 2019. Both together give the message "3 contribution on Aug 3, 2019".
     */
    const tooltip = d3.select('.tooltip')
    const tooltipDate = tooltip.select('.tooltip__date-container')
    const tooltipMessageStart = tooltip.select('.tooltip__message-container')

    // Each week is drawn as a column
    const weeks = d3
      .select('#matrix')
      .selectAll('g')
      .data(weeklyContributionData)
      .enter()
      .append('g')
      .attr('transform', getCellTransformation)

    // Draw each day in week for all weeks
    weeks.each((week, i, weekNodes) => {
      d3.select(weekNodes[i])
        .selectAll('rect')
        .data(week.contributionDays)
        .enter()
        .append('rect')
        .attr('x', 0)
        .attr('y', (d) => paddedCellSize * d.weekday)
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
          tooltip.transition().duration(200).style('opacity', 1)
          tooltip
            .style('left', getTooltipLeftPosition(dayNodes[j]))
            .style('top', getTooltipTopPosition(dayNodes[j]))

          tooltipMessageStart.html(`${getTooltipMessageStartContent(d)}`)
          tooltipDate.html(moment(d.date).format('ll'))
        })
        .on('mouseout', (d) => {
          tooltip.transition().duration(200).style('opacity', 0)
        })
    })
    // FIXME: The months in the x axis are not properly aligned
    // const xAxisScale = d3
    //   .scalePoint()
    //   .domain(months.map((month) => month.name))
    //   .range([48, 760])
    // const xAxis = d3.axisBottom().scale(xAxisScale)
    // const xAxisGroup = d3.select('svg').append('g').call(xAxis)

    // Create the Scale we will use for the Axis
    const yAxisScale = d3
      .scalePoint()
      .domain(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'])
      // Center of first cell is calculated as follows y axis padding (20) + half of cell size (6)
      // TODO: Use constants
      .range([26, 110])

    //Create the Axis
    const yAxis = d3
      .axisRight()
      .tickFormat((day) => (['Mon', 'Wed', 'Fri'].includes(day) ? day : ''))
      .tickSizeOuter(0)
      .scale(yAxisScale)
    const yAxisGroup = d3.select('#matrix').append('g').call(yAxis)

    // Removing the tick lines and the axes line using method suggested by
    // Mike Bostock https://github.com/d3/d3-axis/issues/48
    d3.selectAll('.tick line').remove()
    d3.selectAll('.domain').remove()
  })
  .catch((err) => console.log('Unable to get contributions', err))
