import React, {Component} from 'react'
import {Switch, Route} from 'react-router-dom'
import {Link} from 'react-router-dom'
import 'antd/dist/antd.css';
import './App.css'
import {withRouter} from 'react-router-dom'

import {Layout, Menu, Breadcrumb} from 'antd';

const {Header, Content, Footer} = Layout;


const parseBlock = s => (
    s.replace(/\n{2,}/, '__NEWLINE__').replace('\n', '').replace('__NEWLINE__', '\n').trim()
);

class PageRenderer extends Component {
    baseUrl = 'https://raw.githubusercontent.com/gfcooking/recipes/master';
    props = {name: ''};
    state = {title: '', description: '', ingredientTables: {}, ingredientTableOrder: [], directions: '', notes: ''};

    componentWillMount() {
        fetch(this.baseUrl + '/' + this.props.name).then(r => r.text()).then(text => {
            let lines = text.split('\n');
            const title = lines[0].replace(/^-*/, '').replace(/-*$/, '');
            lines = lines.slice(1);
            const lineGroups = [[]];
            let curLines = lineGroups[0];
            for (let i = 0; i < lines.length; ++i) {
                let line = lines[i].trim();
                if (line[0] === '#') {
                    // Do nothing
                } else if (line.startsWith('///')) {
                    curLines = [];
                    lineGroups.push(curLines);
                } else {
                    curLines.push(lines[i]);
                }
            }
            let [, description, ingredientLines, directions, ...other] = lineGroups;
            description = parseBlock(description.join('\n'));
            directions = parseBlock(directions.join('\n'));
            let notes = other ? other[0] : '';
            let curTable = [];
            const ingredientTableOrder = ['__default'];
            const ingredientTables = {__default: curTable};
            for (let i = 0; i < ingredientLines.length; ++i) {
                let line = ingredientLines[i].trim();
                if (line.length === 0 || line.startsWith('#')) {
                    continue
                }
                if (line.startsWith('***')) {
                    let title = line.replace(/^\**/, '').replace(/\**$/, '').trim();
                    curTable = [];
                    ingredientTableOrder.push(title);
                    ingredientTables[title] = curTable;
                } else {
                    let [amount, ingredient,] = ingredientLines[i].replace('\t', '    ').split(/\s{3,}/, 1);
                    amount = amount.replace(/^[- ]*/, '').replace('tbs', 'tsp');
                    curTable.push([amount, ingredient]);
                }
            }
            this.setState({title, description, ingredientTables, ingredientTableOrder, directions, notes})
        })
    }

    render() {
        return <div>
            <h1>{this.state.title}</h1>
            <p><i>{this.state.description}</i></p>
            <h2>Ingredients</h2>
            {this.state.ingredientTableOrder.map(tableName => (
                <div>
                    {tableName.startsWith("_") ? <div/> : <h3>{tableName}</h3>}
                    <ul>
                        {this.state.ingredientTables[tableName].map(([amount, ingredient]) => {
                            return <li><b>{amount}</b> {ingredient}</li>;
                        })}
                    </ul>
                </div>
            ))}
            <h2>Directions</h2>
            <p>{this.state.directions}</p>
            {this.state.notes ? <p>{this.state.notes}</p> : <div/>}
        </div>;
    }
}


class App extends Component {

    listUrl = 'https://raw.githubusercontent.com/gfcooking/recipes/master/RecipeList.txt';

    state = {files: []};

    componentWillMount() {
        fetch(this.listUrl).then(r => r.text()).then(text => {
            let lines = text.split('\n').filter(x => x.trim().length > 0 && !x.startsWith('///') && !x.startsWith('--'));
            this.setState({files: lines.map(x => x.trim())});
        });
    }

    pathParts = () => {
        return this.props.location.pathname.split('/').filter(x => x);
    };

    render() {
        return (
            <Layout className="layout">
                <Header>
                    <div className="logo"/>
                    <Menu
                        theme="dark"
                        mode="horizontal"
                        defaultSelectedKeys={['1']}
                        style={{lineHeight: '64px'}}
                    >
                        <Menu.Item key="1" active><a href="/#">Home</a></Menu.Item>
                    </Menu>
                </Header>
                <Content style={{padding: '0 50px'}} className='Site-content'>
                    <Breadcrumb style={{margin: '16px 0'}} linkRender={undefined} nameRender={undefined}
                                params={undefined} prefixCls={undefined} routes={undefined}>
                        {['Home', ...this.pathParts()].map(i => <Breadcrumb.Item><a
                            href={'/#' + i.replace('Home', '')}>{i}</a></Breadcrumb.Item>)}
                    </Breadcrumb>
                    <div style={{background: '#fff', padding: 24, minHeight: 280, height: '100%'}}>
                        <Switch>
                            <Route exact path='/' component={() => {
                                return <div>
                                    <h1>Gluten Free Cooking</h1>
                                    <p>Welcome to the GF Cooking homepage</p>
                                    <ul>
                                        {this.state.files.map(fn => {
                                            const loc = fn.replace('.txt', '');
                                            return <li>
                                                <Link to={'/' + loc}>
                                                    {loc.replace(/-/g, " ").replace(/([A-Z(]+)/g, ' $1')
                                                        .replace(/^./, str => str.toUpperCase())}
                                                </Link>
                                            </li>;
                                        })}
                                    </ul>
                                </div>
                            }}/>
                            {this.state.files.map(name => {
                                return <Route exact path={'/' + name.replace('.txt', '')}
                                              render={() => <PageRenderer id={name} name={name}/>}/>
                            })}
                        </Switch>
                    </div>
                </Content>
                <Footer style={{textAlign: 'center'}}>
                    Copyright © 2019 Scholefield
                </Footer>
            </Layout>
        );
    }
}

export default withRouter(App);
