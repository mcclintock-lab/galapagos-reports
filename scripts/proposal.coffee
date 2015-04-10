OverviewTab = require './overview.coffee'
TradeoffsTab = require './tradeoffs.coffee'
HabitatsTab = require './habitats.coffee'
window.app.registerReport (report) ->
  report.tabs [OverviewTab, HabitatsTab, TradeoffsTab]
  # path must be relative to dist/
  report.stylesheets ['./proposal.css']

