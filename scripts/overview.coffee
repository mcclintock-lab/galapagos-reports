ReportTab = require 'reportTab'
templates = require '../templates/templates.js'
d3 = window.d3

class OverviewTab extends ReportTab
  name: 'Overview'
  className: 'overview'
  template: templates.overview
  dependencies:[ 
    'SizeStats'
  ]
  render: () ->
    names = {
              "mixed_use": "Transición", 
              "sustainable_use": "Aprovechamiento Sustenable", 
              "non_extractive_use": 'Conservación', 
              "intangible": 'Intangible'
            }
    traslation = {MIXED_USE_ZONE: "Transición", SUSTAINABLE_ZONE: "Aprovechamiento Sustenable", INTANGIBLE_ZONE: "Intangible", EXTRACTIVE_ZONE: "Conservación"}
    # create random data for visualization
    size_stats = @recordSet('SizeStats', 'SizeStats').toArray()

    isCollection = @model.isCollection()
    size_km = 0
    if !isCollection
      size_km = size_stats[0].TOTAL
    else
      for stat in size_stats
        stat.ZONE_TYPE = names[stat.ZONE_TYPE]
    # setup context object with data and render the template from it
    context =
      sketch: @model.forTemplate()
      sketchClass: @sketchClass.forTemplate()
      attributes: @model.getAttributes()
      admin: @project.isAdmin window.user
      isCollection: isCollection
      size_stats: size_stats
      size_km: size_km
    
    @$el.html @template.render(context, templates)




module.exports = OverviewTab