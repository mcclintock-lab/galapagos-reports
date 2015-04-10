OverviewTab = require './overview.coffee'
HabitatsTab = require './habitats.coffee'
window.app.registerReport (report) ->
  report.tabs [OverviewTab, HabitatsTab]
  # path must be relative to dist/
  report.stylesheets ['./report.css']

